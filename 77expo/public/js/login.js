document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("login-msg");
  msg.textContent = "";
  msg.className = "msg";

  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || "accesso negato.";
      msg.className = "msg error";
      return;
    }

    window.location.href = "/admin";
  } catch (err) {
    msg.textContent = "errore di rete.";
    msg.className = "msg error";
  }
});
