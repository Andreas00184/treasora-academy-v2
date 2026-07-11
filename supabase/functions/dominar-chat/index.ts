import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildSystemPrompt,
  buildWelcomeFallback,
  buildWelcomePrompt,
  fetchUserMemory,
  inferTopic,
} from "../_shared/memory.ts";

const FREE_DAILY_LIMIT = 5;

async function callOpenAI(
  openaiKey: string,
  systemContent: string,
  chatMessages: { role: string; content: string }[],
): Promise<string> {
  const messages = [{ role: "system", content: systemContent }, ...chatMessages];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

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

    const memory = await fetchUserMemory(admin, user.id);
    const isPro = memory.profile?.is_pro === true;
    const today = new Date().toISOString().slice(0, 10);

    const body = await req.json();
    const isWelcome = body.welcome === true;
    const message = String(body.message || "").trim();

    if (!isWelcome && !message) {
      return new Response(JSON.stringify({ error: "Message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let usageCount = 0;
    if (!isPro && !isWelcome) {
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

    const systemPrompt = buildSystemPrompt(memory);
    let reply: string;

    if (isWelcome) {
      if (openaiKey) {
        reply = await callOpenAI(openaiKey, systemPrompt, [
          {
            role: "user",
            content: buildWelcomePrompt(memory),
          },
        ]);
      } else {
        reply = buildWelcomeFallback(memory);
      }

      await admin.from("dominar_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: reply,
      });

      return new Response(
        JSON.stringify({ reply, welcome: true, isPro }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const chatHistory = memory.recentMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    chatHistory.push({ role: "user", content: message });

    if (openaiKey) {
      reply = await callOpenAI(openaiKey, systemPrompt, chatHistory);
    } else {
      reply =
        "Dominar is in demo mode (OpenAI key not configured). Your question was received: \"" +
        message.slice(0, 120) +
        (message.length > 120 ? "…" : "") +
        "\"";
    }

    const topic = inferTopic(message);
    if (topic) {
      await admin
        .from("financial_passports")
        .update({ last_topic_discussed: topic, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
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

    await admin.from("dominar_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

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
