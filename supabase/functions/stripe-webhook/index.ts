import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  customerIdFromStripe,
  downgradeToFree,
  resolveUserId,
  syncSubscriptionToProfile,
  upsertBillingInvoice,
} from "../_shared/stripe-sync.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = await resolveUserId(admin, {
          userId: session.metadata?.supabase_user_id || session.client_reference_id,
          customerId: customerIdFromStripe(session.customer),
        });

        if (!userId) break;

        const customerId = customerIdFromStripe(session.customer);
        if (customerId) {
          await admin.from("profiles").update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
        }

        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionToProfile(admin, userId, sub);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(admin, {
          userId: sub.metadata?.supabase_user_id,
          customerId: customerIdFromStripe(sub.customer),
          subscriptionId: sub.id,
        });

        if (userId) {
          await syncSubscriptionToProfile(admin, userId, sub);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(admin, {
          userId: sub.metadata?.supabase_user_id,
          customerId: customerIdFromStripe(sub.customer),
          subscriptionId: sub.id,
        });

        if (userId) {
          await downgradeToFree(admin, userId, {
            customerId: customerIdFromStripe(sub.customer) ?? undefined,
            status: "canceled",
          });
          await admin.from("profiles").update({
            stripe_subscription_id: null,
          }).eq("id", userId);
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = customerIdFromStripe(invoice.customer);
        const userId = await resolveUserId(admin, {
          customerId,
          subscriptionId:
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id,
        });

        if (userId) {
          await upsertBillingInvoice(admin, userId, invoice);
        }

        // Refresh subscription state after payment events
        if (event.type === "invoice.paid" && invoice.subscription) {
          const subId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const paidUserId = await resolveUserId(admin, {
            userId: sub.metadata?.supabase_user_id,
            customerId,
            subscriptionId: subId,
          });
          if (paidUserId) {
            await syncSubscriptionToProfile(admin, paidUserId, sub);
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", event.type, err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
