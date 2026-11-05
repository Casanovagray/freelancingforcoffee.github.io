// Header "Admin login" trigger, accessible login modal, and session-aware nav buttons.
import { configured, login, logout, onAuth } from "./api.js";
import { toast } from "./ui.js";

const ICON = {
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
};

let dlg;
function ensureDialog() {
  if (dlg) return dlg;
  dlg = document.createElement("dialog");
  dlg.className = "auth-dialog";
  dlg.setAttribute("aria-labelledby", "authTitle");
  dlg.innerHTML = `
    <form class="auth-form" novalidate>
      <h2 id="authTitle">Admin login</h2>
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="username" required></label>
      <label class="field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>
      <p class="auth-error" role="alert" hidden></p>
      <div class="auth-actions">
        <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
        <button type="submit" class="btn btn-primary">Sign in</button>
      </div>
    </form>`;
  document.body.append(dlg);
  const form = dlg.querySelector("form");
  const err = dlg.querySelector(".auth-error");
  dlg.querySelector("[data-cancel]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // backdrop click
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("[type=submit]");
    err.hidden = true;
    if (!form.email.value || !form.password.value) { err.textContent = "Enter your email and password."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Signing in…";
    try {
      await login(form.email.value.trim(), form.password.value);
      form.reset();
      dlg.close();
      toast("Signed in");
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = "Sign in";
    }
  });
  return dlg;
}

export function openLogin() {
  const d = ensureDialog();
  if (!d.open) d.showModal();
  d.querySelector("input[name=email]").focus();
}

function mountNav() {
  const container = document.querySelector(".site-nav .container");
  const burger = container?.querySelector(".burger");
  if (!burger) return null;
  const wrap = document.createElement("div");
  wrap.className = "nav-right";
  const slot = document.createElement("div");
  slot.className = "admin-slot";
  burger.before(wrap);
  wrap.append(slot, burger);
  return slot;
}

function render(slot, user) {
  slot.innerHTML = user
    ? `<a class="admin-btn" href="admin.html" aria-label="Open admin dashboard" title="Dashboard">${ICON.dash}</a>
       <button class="admin-btn" type="button" data-logout aria-label="Log out" title="Log out">${ICON.out}</button>`
    : `<button class="admin-btn" type="button" data-login aria-label="Admin login" title="Admin login">${ICON.lock}</button>`;
}

const slot = mountNav();
if (slot) {
  render(slot, null);
  slot.addEventListener("click", async (e) => {
    if (e.target.closest("[data-login]")) openLogin();
    if (e.target.closest("[data-logout]")) {
      await logout();
      toast("Logged out", "info"); // admin.js re-locks itself via onAuth
    }
  });
  if (configured) onAuth((user) => render(slot, user));
}
