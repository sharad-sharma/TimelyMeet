const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { google } = require("googleapis");
const open = require("open").default;
const express = require("express");
const destroyer = require("server-destroy");

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(app.getPath("userData"), "token.json");

function authorize(callback) {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_secret, client_id } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost"
  );

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  } else {
    getAccessToken(oAuth2Client, callback);
  }
}

// Get a new token if one doesn’t exist
function getAccessToken(oAuth2Client, callback) {
  const app = express();

  const server = app.listen(0, () => {
    const port = server.address().port;
    const redirectUri = `http://localhost:${port}/oauth2callback`;

    oAuth2Client.redirectUri = redirectUri;

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log(`Listening on ${redirectUri}`);
    open(authUrl);
  });

  destroyer(server);

  app.get("/oauth2callback", (req, res) => {
    const code = req.query.code;
    res.send("Authentication successful! You can close this window.");

    server.destroy();

    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log("Token saved to", TOKEN_PATH);
      callback(oAuth2Client);
    });
  });
}

// Fetch upcoming events
function getUpcomingEvents(auth, callback) {
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, res) => {
      if (err) return console.error("API Error:", err);
      const events = res.data.items.map((event) => ({
        title: event.summary,
        time: event.start.dateTime || event.start.date,
        link: event.location || event.htmlLink,
        status: event.status,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        organizer: event.organizer || event.creator,
      }));
      callback(events);
    }
  );
}

module.exports = { authorize, getUpcomingEvents };
