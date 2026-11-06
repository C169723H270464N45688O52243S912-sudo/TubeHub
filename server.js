const { randomUUID } = require("crypto");

const authSessions = new Map();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  // Helps preserve communication between the popup and TubeHub.
  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

// Check whether Composio secrets are configured.
app.get("/api/youtube/connection", (req, res) => {
  res.json({
    configured: Boolean(
      process.env.COMPOSIO_API_KEY &&
      process.env.COMPOSIO_YOUTUBE_AUTH_CONFIG_ID
    )
  });
});

// Create the Composio authorization link.
app.post("/api/youtube/connect", async (req, res) => {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY;
    const authConfigId =
      process.env.COMPOSIO_YOUTUBE_AUTH_CONFIG_ID;

    if (!apiKey || !authConfigId) {
      return res.status(500).json({
        error: "Composio secrets are missing."
      });
    }

    const appUrl =
  "https://shiny-space-garbanzo-p7wrqg456rw5296jp-3000.app.github.dev";

    const sessionId = randomUUID();

const callbackUrl =
  `${appUrl}/auth/callback?session=${sessionId}`;

    const response = await fetch(
      "https://backend.composio.dev/api/v3.1/connected_accounts/link",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          auth_config_id: authConfigId,
          user_id: "tubehub-personal-user",
          callback_url: callbackUrl
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Composio error:", response.status);

      return res.status(502).json({
        error: "Composio could not create the connection link."
      });
    }

    if (!data.redirect_url) {
      return res.status(502).json({
        error: "Composio did not return an authorization URL."
      });
    }

    res.json({
      redirectUrl: data.redirect_url
    });

  } catch (error) {
    console.error("Connection error:", error.message);

    res.status(500).json({
      error: "The server could not contact Composio."
    });
  }
});

// Composio sends the popup here after authorization.
app.get("/auth/callback", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>TubeHub - Connection</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #0d0e11;
      color: white;
      font-family: Arial, sans-serif;
      display: grid;
      place-items: center;
      min-height: 90vh;
      text-align: center;
    }
  </style>
</head>
<body>
  <div>
    <h2 id="message">Finishing YouTube connection...</h2>
    <p>You can return to TubeHub.</p>
  </div>

  <script>
    const params = new URLSearchParams(location.search);
    const status = params.get("status");

    document.getElementById("message").textContent =
      status === "success"
        ? "YouTube connected!"
        : "Connection was not completed.";

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: "tubehub-oauth-complete",
        status: status
      }, window.location.origin);

      setTimeout(() => window.close(), 1000);
    }
  </script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TubeHub running on port ${PORT}`);
});
