/* ============================================================
   BAR MUBITI ADMIN — auth
   ============================================================ */

const setupNote = document.getElementById("setupNote");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");

if (!IS_SUPABASE_CONFIGURED || !supabaseClient) {
  setupNote.innerHTML =
    "Backend isn't connected yet.<br>Open <code>js/supabase-config.js</code>, add your Supabase Project URL and anon key, then reload this page. See README.md for full setup steps.";
  loginForm.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
} else {
  setupNote.textContent = "Don't have an admin account yet? Create one from your Supabase Dashboard → Authentication → Users → Add user. Then sign in here with that email and password.";

  // If already signed in, skip straight to dashboard.
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) window.location.href = "dashboard.html";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.remove("show");
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";

    if (error) {
      loginError.textContent = error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message;
      loginError.classList.add("show");
      return;
    }
    window.location.href = "dashboard.html";
  });
}
