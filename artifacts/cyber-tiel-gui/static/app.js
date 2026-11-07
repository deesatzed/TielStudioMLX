const form = document.getElementById("form");
const chat = document.getElementById("chat");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = document.getElementById("prompt").value;
  const file = document.getElementById("image").files[0];
  const max_tokens = document.getElementById("max_tokens").value;
  const temp = document.getElementById("temp").value;

  const userDiv = document.createElement("div");
  userDiv.innerHTML = `<strong>You:</strong> ${prompt}`;
  chat.appendChild(userDiv);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("max_tokens", max_tokens);
  formData.append("temperature", temp);
  if (file) formData.append("image", file);

  const resp = await fetch("/api/generate", { method: "POST", body: formData });
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  const botDiv = document.createElement("div");
  botDiv.innerHTML = "<strong>Cyber-Tiel:</strong> ";
  chat.appendChild(botDiv);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    botDiv.innerHTML += decoder.decode(value);
    chat.scrollTop = chat.scrollHeight;
  }
});

// TODO: load model button, status polling
