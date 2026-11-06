
async function connectYouTube() {
  const popup = window.open(
    "about:blank",
    "tubehub-auth",
    "popup=yes,width=520,height=720"
  );

  if (!popup) {
    alert("did you just block the pop-up? shame on you. shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame shame");
    return;
  }

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

    popup.location.href = data.redirectUrl;

    const sessionId = data.sessionId;
    let attempts = 0;

    const checkConnection = async () => {
      if (attempts++ > 180) {
        throw new Error("Connection timed out. Please try again.");
      }

      const result = await fetch(
        `/api/youtube/status/${sessionId}`
      );

      const statusData = await result.json();

      if (statusData.status === "success") {
        buttons.forEach(button => {
          button.disabled = false;
          button.textContent = "✓ YouTube Connected";
        });

        if (!popup.closed) popup.close();

        alert("YouTube connected successfully!");
        return;
      }

      if (statusData.status === "failed") {
        throw new Error("YouTube authorization failed.");
      }

      setTimeout(checkConnection, 1000);
    };

    checkConnection();

  } catch (error) {
    if (!popup.closed) popup.close();

    buttons.forEach((button, index) => {
      button.disabled = false;
      button.textContent = index === 0
        ? "▶ Connect YouTube"
        : "Connect your account →";
    });

    alert(error.message);
  }
}

// Receive the result from the authorization popup.
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type !== "tubehub-oauth-complete") return;

  const success = event.data.status === "success";

  const connectButton = document.getElementById("connectButton");
  const welcomeConnect = document.getElementById("welcomeConnect");

  if (success) {
    connectButton.textContent = "✓ YouTube Connected";
    welcomeConnect.textContent = "Connected!";
    alert("YouTube connected successfully!");
  } else {
    connectButton.disabled = false;
    welcomeConnect.disabled = false;
    connectButton.textContent = "▶ Connect YouTube";
    welcomeConnect.textContent = "Connect your account →";
    alert("YouTube authorization was not completed.");
  }
});

document.getElementById("connectButton")
  .addEventListener("click", connectYouTube);

document.getElementById("welcomeConnect")
  .addEventListener("click", connectYouTube);
