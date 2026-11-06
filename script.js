
async function connectYouTube() {
  // Open the popup immediately during the button click.
  const popup = window.open(
    "about:blank",
    "tubehub-composio-auth",
    "popup=yes,width=520,height=720"
  );

  if (!popup) {
    alert("the fucking popup was blocked. disable ur blocker mf and try again never.");
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

    if (!data.redirectUrl) {
      throw new Error("No authorization link was returned.");
    }

    // Send the popup to Composio instead of redirecting TubeHub.
    popup.location.href = data.redirectUrl;

  } catch (error) {
    popup.close();
    alert(error.message);

    buttons.forEach((button, index) => {
      button.disabled = false;
      button.textContent = index === 0
        ? "▶ Connect YouTube"
        : "Connect your account →";
    });
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
