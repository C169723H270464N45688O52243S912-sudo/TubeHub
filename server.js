
const express = require("express");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const APP_URL =
  "https://shiny-space-garbanzo-p7wrqg456rw5296jp-3000.app.github.dev";

const authSessions = new Map();

app.use((req, res, next) => {
  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

// Check whether Composio secrets exist.
app.get("/api/youtube/connection", (req, res) => {
  res.json({
    configured: Boolean(
      process.env.COMPOSIO_API_KEY &&
      process.env.COMPOSIO_YOUTUBE_AUTH_CONFIG_ID
    )
  });
});

// Create a YouTube authorization link.
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

    const sessionId = randomUUID();

    const callbackUrl =
      `${APP_URL}/auth/callback?session=${sessionId}`;

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
      console.error("Composio API error:", response.status);

      return res.status(502).json({
        error: "Composio could not create the connection link."
      });
    }

    if (!data.redirect_url) {
      return res.status(502).json({
        error: "Composio did not return an authorization URL."
      });
    }

    // Successful response.
    res.json({
      redirectUrl: data.redirect_url,
      sessionId
    });

  } catch (error) {
    console.error("Connection error:", error.message);

    res.status(500).json({
      error: "The server could not contact Composio."
    });
  }
});

// Check authorization progress.
app.get("/api/youtube/status/:sessionId", (req, res) => {
  const status = authSessions.get(req.params.sessionId);

  res.json({
    status: status || "pending"
  });
});

// Receive the Composio callback.
app.get("/auth/callback", (req, res) => {
  const sessionId = req.query.session;
  const status = req.query.status;

  if (
    sessionId &&
    (status === "success" || status === "failed")
  ) {
    authSessions.set(sessionId, status);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TubeHub Connection</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          background: #0d0e11;
          color: white;
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 80px 20px;
        }

        h2 {
          color: #ff7138;
        }
      </style>
    </head>
    <body>
      <h2 id="message">Finishing connection...</h2>
      <p>You can return to TubeHub.</p>

      <script>
        const status = new URLSearchParams(
          window.location.search
        ).get("status");

        document.getElementById("message").textContent =
          status === "success"
            ? "YouTube connected successfully!"
            : "Connection was not completed.";

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: "tubehub-oauth-complete",
            status: status
          }, window.location.origin);
        }

        setTimeout(() => window.close(), 1500);
      </script>
    </body>
    </html>
  `);
});

// Start server.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TubeHub running on port ${PORT}`);
  console.log(`Public URL: ${APP_URL}`);
});
