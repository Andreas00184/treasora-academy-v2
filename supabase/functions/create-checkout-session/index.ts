import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

type Plan = "monthly" | "annual";

function resolvePriceId(plan: Plan): string | null {
  const monthly =
    Deno.env.get("STRIPE_PRO_MONTHLY_PRICE_ID") || Deno.env.get("STRIPE_PRO_PRICE_ID");
  const annual = Deno.env.get("STRIPE_PRO_ANNUAL_PRICE_ID");

  if (plan === "annual") return annual || null;
  return monthly || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sign in required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://treasora.academy";

    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          error: "Stripe not configured. Set STRIPE_SECRET_KEY in Edge Function secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, current_plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.json().catch(() => ({}));
    const plan: Plan = body.plan === "annual" ? "annual" : "monthly";
    const priceId = resolvePriceId(plan);

    if (!priceId) {
      const missing =
        plan === "annual"
          ? "STRIPE_PRO_ANNUAL_PRICE_ID"
          : "STRIPE_PRO_MONTHLY_PRICE_ID (or STRIPE_PRO_PRICE_ID)";
      return new Response(
        JSON.stringify({ error: `Stripe price not configured. Set ${missing} in Edge Function secrets.` }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const successUrl = body.successUrl || `${siteUrl}/dashboard.html?upgraded=1`;
    const cancelUrl = body.cancelUrl || `${siteUrl}/join-pro.html?canceled=1`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
    };

    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email ?? undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
