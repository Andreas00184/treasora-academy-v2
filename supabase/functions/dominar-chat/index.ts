import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const FREE_DAILY_LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    const isPro = profile?.is_pro === true;
    const today = new Date().toISOString().slice(0, 10);

    let usageCount = 0;
    if (!isPro) {
      const { data: usage } = await admin
        .from("dominar_daily_usage")
        .select("question_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();
      usageCount = usage?.question_count ?? 0;
      if (usageCount >= FREE_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "Daily limit reached",
            code: "LIMIT_REACHED",
            remaining: 0,
            limit: FREE_DAILY_LIMIT,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reply: string;
    if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are Dominar, Treasora Academy's AI financial education assistant. Give clear, practical answers about personal finance, investing, and the Treasora curriculum. Never provide personalized investment advice or guarantee returns. Encourage learning and responsible decisions.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } else {
      reply =
        "Dominar is in demo mode (OpenAI key not configured). For production, set OPENAI_API_KEY in Supabase Edge Function secrets. Your question was received: \"" +
        message.slice(0, 120) +
        (message.length > 120 ? "…" : "") +
        "\"";
    }

    if (!isPro) {
      await admin.from("dominar_daily_usage").upsert(
        {
          user_id: user.id,
          usage_date: today,
          question_count: usageCount + 1,
        },
        { onConflict: "user_id,usage_date" },
      );
    }

    await admin.from("dominar_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });
    await admin.from("dominar_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: reply,
    });

    const remaining = isPro ? null : FREE_DAILY_LIMIT - usageCount - 1;

    return new Response(
      JSON.stringify({ reply, remaining, limit: isPro ? null : FREE_DAILY_LIMIT, isPro }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
