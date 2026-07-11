(function () {
  var joinProBtn = document.getElementById("join-pro-btn");
  var checkoutError = document.getElementById("checkout-error");
  if (!joinProBtn) return;

  async function updateButtonForSession() {
    if (!window.SUPABASE_CONFIGURED) return;

    var sessionResult = await supabaseClient.auth.getSession();
    var session = sessionResult.data.session;

    if (session) {
      joinProBtn.textContent = "Start Pro Today";
      joinProBtn.href = "#";
      joinProBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        if (checkoutError) checkoutError.style.display = "none";
        joinProBtn.style.opacity = ".6";
        joinProBtn.textContent = "Redirecting to checkout...";

        try {
          var res = await fetch(CHECKOUT_FUNCTION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + session.access_token,
            },
          });
          var data = await res.json();
          if (!res.ok || !data.url) {
            throw new Error(data.error || "Could not start checkout");
          }
          window.location.href = data.url;
        } catch (err) {
          joinProBtn.style.opacity = "1";
          joinProBtn.textContent = "Start Pro Today";
          if (checkoutError) {
            checkoutError.textContent = "Couldn't start checkout — please try again.";
            checkoutError.style.display = "block";
          }
        }
      });
    }
  }

  updateButtonForSession();
})();
