import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export type ProfileSubscriptionUpdate = {
  is_pro: boolean;
  current_plan: "free" | "pro";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  renewal_date?: string | null;
  updated_at: string;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isActiveSubscription(status: string | null | undefined): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

export async function resolveUserId(
  admin: SupabaseClient,
  opts: { userId?: string | null; customerId?: string | null; subscriptionId?: string | null },
): Promise<string | null> {
  if (opts.userId) return opts.userId;

  if (opts.subscriptionId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", opts.subscriptionId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (opts.customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", opts.customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export function subscriptionToProfileUpdate(
  sub: Stripe.Subscription,
  customerId: string,
): ProfileSubscriptionUpdate {
  const active = isActiveSubscription(sub.status);
  return {
    is_pro: active,
    current_plan: active ? "pro" : "free",
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    renewal_date: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
}

export async function syncSubscriptionToProfile(
  admin: SupabaseClient,
  userId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";

  const update = subscriptionToProfileUpdate(sub, customerId);

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) console.error("Failed to sync subscription to profile:", error);
}

export async function downgradeToFree(
  admin: SupabaseClient,
  userId: string,
  opts?: { customerId?: string; status?: string },
): Promise<void> {
  const update: ProfileSubscriptionUpdate = {
    is_pro: false,
    current_plan: "free",
    subscription_status: opts?.status ?? "canceled",
    renewal_date: null,
    updated_at: new Date().toISOString(),
  };

  if (opts?.customerId) update.stripe_customer_id = opts.customerId;

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) console.error("Failed to downgrade profile:", error);
}

export async function upsertBillingInvoice(
  admin: SupabaseClient,
  userId: string,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : invoice.status === "paid" && invoice.created
      ? new Date(invoice.created * 1000).toISOString()
      : null;

  const line = invoice.lines?.data?.[0];
  const description =
    line?.description ||
    (line?.price?.nickname ? `Treasora Pro — ${line.price.nickname}` : "Treasora Pro subscription");

  const { error } = await admin.from("billing_history").upsert(
    {
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
      currency: invoice.currency ?? "usd",
      status: invoice.status ?? "unknown",
      description,
      invoice_pdf_url: invoice.invoice_pdf ?? null,
      paid_at: paidAt,
    },
    { onConflict: "stripe_invoice_id" },
  );

  if (error) console.error("Failed to upsert billing history:", error);
}

export function customerIdFromStripe(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.id;
}
