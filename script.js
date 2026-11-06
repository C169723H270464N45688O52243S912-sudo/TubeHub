
async function connectYouTube() {
  const buttons = [
    document.getElementById("connectButton"),
    document.getElementById("welcomeConnect")
  ];

  // Open popup immediately to avoid popup blockers.
  const popup = window.open(
    "about:blank",
    "tubehub-auth",
    "popup=yes,width=520,height=720"
  );

  if (!popup) {
    alert("did you just block the popup? shame on you. shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame.");
    return;
  }

  buttons.forEach(button => {
    if (button) {
      button.disabled = true;
      button.textContent = "Connecting...";
    }
  });

  try {
    // Request authorization link from TubeHub server.
    const response = await fetch("/api/youtube/connect", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Connection failed.");
    }

    if (!data.redirectUrl || !data.sessionId) {
      throw new Error("Missing authorization information.");
    }

    // Open Composio inside the popup.
    popup.location.href = data.redirectUrl;

    const sessionId = data.sessionId;
    let attempts = 0;

    // Check the server for authorization completion.
    const checkConnection = async () => {
      if (attempts++ >= 180) {
        throw new Error("Connection timed out. Please try again.");
      }

      const result = await fetch(
        `/api/youtube/status/${encodeURIComponent(sessionId)}`
      );

      if (!result.ok) {
        throw new Error("Could not check connection status.");
      }

      const statusData = await result.json();

      if (statusData.status === "success") {
        buttons.forEach(button => {
          if (button) {
            button.disabled = false;
            button.textContent = "✓ YouTube Connected";
          }
        });

        if (!popup.closed) popup.close();

        alert("YouTube authorization completed!");
        return;
      }

      if (statusData.status === "failed") {
        throw new Error("YouTube authorization failed.");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      return checkConnection();
    };

    await checkConnection();

  } catch (error) {
    if (!popup.closed) popup.close();

    buttons.forEach((button, index) => {
      if (button) {
        button.disabled = false;
        button.textContent = index === 0
          ? "▶ Connect YouTube"
          : "Connect your account →";
      }
    });

    alert(error.message);
    console.error("TubeHub connection error:", error);
  }
}

// Listen for popup messages as an additional notification.
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type !== "tubehub-oauth-complete") return;

  if (event.data.status === "success") {
    const button = document.getElementById("connectButton");

    if (button) {
      button.textContent = "✓ YouTube Connected";
      button.disabled = false;
    }
  }
});

// Connect buttons.
document.getElementById("connectButton")
  .addEventListener("click", connectYouTube);

document.getElementById("welcomeConnect")
  .addEventListener("click", connectYouTube);
