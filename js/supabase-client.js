/**
 * Shared Supabase client for Treasora Academy static pages.
 */
(function (global) {
  var cfg = global.TREASORA_CONFIG || {};
  var url = cfg.SUPABASE_URL || "YOUR_SUPABASE_URL";
  var key = cfg.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

  var configured = url !== "YOUR_SUPABASE_URL" && key !== "YOUR_SUPABASE_ANON_KEY";
  var client = null;

  if (configured && global.supabase) {
    try {
      client = global.supabase.createClient(url, key);
    } catch (err) {
      console.error("Supabase init failed:", err);
    }
  }

  function functionUrl(name) {
    if (!configured) return "";
    return url.replace(/\/$/, "") + "/functions/v1/" + name;
  }

  global.TreasoraSupabase = {
    configured: configured,
    url: url,
    anonKey: key,
    client: client,
    functionUrl: functionUrl,
    dominarChatUrl: functionUrl("dominar-chat"),
    checkoutUrl: functionUrl("create-checkout-session"),
  };

  // Back-compat for inline scripts that expect these globals
  global.SUPABASE_CONFIGURED = configured;
  global.supabaseClient = client;
  global.SUPABASE_URL = url;
  global.SUPABASE_ANON_KEY = key;
  global.DOMINAR_FUNCTION_URL = functionUrl("dominar-chat");
  global.CHECKOUT_FUNCTION_URL = functionUrl("create-checkout-session");
})(window);
