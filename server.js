
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Check whether Composio is configured
app.get("/api/youtube/connection", (req, res) => {
  res.json({
    configured: Boolean(
      process.env.COMPOSIO_API_KEY &&
      process.env.COMPOSIO_YOUTUBE_AUTH_CONFIG_ID
    )
  });
});

// Start YouTube authorization
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
          user_id: "tubehub-personal-user"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Composio API status:", response.status);

      return res.status(502).json({
        error: "Composio could not create the connection link.",
        details: data.error?.message || data.message || "Check your Composio configuration."
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
    console.error("YouTube connection error:", error.message);

    res.status(500).json({
      error: "The server could not contact Composio."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TubeHub running on port ${PORT}`);
});
