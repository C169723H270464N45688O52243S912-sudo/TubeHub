
async function connectYouTube() {
  const buttons = [
    document.getElementById("connectButton"),
    document.getElementById("welcomeConnect")
  ];

  buttons.forEach(button => {
    button.disabled = true;
    button.textContent = "Connecting...";
  });

  try {
    const response = await fetch("/api/youtube/connect", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Connection failed.");
    }

    if (!data.redirectUrl) {
      throw new Error("Composio did not return an authorization link.");
    }

    window.location.href = data.redirectUrl;

  } catch (error) {
    alert(error.message);

    buttons.forEach((button, index) => {
      button.disabled = false;
      button.textContent = index === 0
        ? "▶ Connect YouTube"
        : "Connect your account →";
    });
  }
}

document.getElementById("connectButton")
  .addEventListener("click", connectYouTube);

document.getElementById("welcomeConnect")
  .addEventListener("click", connectYouTube);
