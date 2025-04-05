const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const open = require("open");

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const TOKEN_PATH = path.join(__dirname, "token.json");

// Load credentials from the credentials file
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

function authorize(callback) {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  } else {
    getNewToken(oAuth2Client, callback);
  }
}

// Get a new token if one doesn’t exist
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this URL:", authUrl);
  // open(authUrl);

  console.log("Enter the code from the browser:");
  process.stdin.once("data", (code) => {
    oAuth2Client.getToken(code.toString().trim(), (err, token) => {
      if (err) return console.error("Error getting token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log("Token saved!");
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
      if (err) return console.error("Error fetching events:", err);
      const events = res.data.items.map((event) => ({
        title: event.summary,
        time: event.start.dateTime || event.start.date,
        link: event.location || event.htmlLink,
        status: event.status,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        organizer: event.organizer || event.creator,
      }));
      console.log("events:", events);
      callback(events);
    }
  );
}

module.exports = { authorize, getUpcomingEvents };
