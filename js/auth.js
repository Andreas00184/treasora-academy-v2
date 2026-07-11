/**
 * Auth helpers: guards, session, sign out.
 */
(function (global) {
  function getClient() {
    return global.TreasoraSupabase && global.TreasoraSupabase.client;
  }

  function isConfigured() {
    return global.TreasoraSupabase && global.TreasoraSupabase.configured;
  }

  async function getSession() {
    var client = getClient();
    if (!client) return null;
    var result = await client.auth.getSession();
    return result.data.session;
  }

  async function getUser() {
    var client = getClient();
    if (!client) return null;
    var result = await client.auth.getUser();
    return result.data.user;
  }

  async function requireAuth(redirectTo) {
    redirectTo = redirectTo || "sign-in.html";
    if (!isConfigured()) return null;
    var session = await getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }
    return session;
  }

  async function redirectIfAuthed(destination) {
    destination = destination || "dashboard.html";
    if (!isConfigured()) return;
    var session = await getSession();
    if (session) window.location.href = destination;
  }

  async function signOut() {
    var client = getClient();
    if (client) await client.auth.signOut();
    window.location.href = "index.html";
  }

  async function getProfile() {
    var client = getClient();
    var user = await getUser();
    if (!client || !user) return null;
    var result = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (result.error) {
      console.error("Profile fetch error:", result.error);
      return null;
    }
    return result.data;
  }

  global.TreasoraAuth = {
    getSession: getSession,
    getUser: getUser,
    requireAuth: requireAuth,
    redirectIfAuthed: redirectIfAuthed,
    signOut: signOut,
    getProfile: getProfile,
    isConfigured: isConfigured,
  };
})(window);
