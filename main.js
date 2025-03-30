const { app, Menu, Tray, shell, Notification } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let tray = null;
let soundProcess = null; // Store the sound process

const meetings = [
  { title: "Daily Standup", time: "11:00 AM", link: "https://zoom.us/j/123456" }
];

app.whenReady().then(() => {
  createTray();
  // Trigger system notification after 10 seconds
  setTimeout(() => {
    sendSystemNotification(meetings[0]);
  }, 10000);
});

function createTray() {
  tray = new Tray(path.join(__dirname, "icon.png"));
  tray.setToolTip("MeetingBar Clone");
  tray.setTitle(" 📅");

  const menuItems = meetings.map(meeting => ({
    label: `${meetings[0].title} - ${meetings[0].time}`,
    click: () => shell.openExternal(meetings[0].link)
  }));

  const contextMenu = Menu.buildFromTemplate([
    { label: "Upcoming Meetings", enabled: false },
    { type: "separator" },
    ...menuItems,
    { type: "separator" },
    { label: "Quit", role: "quit" }
  ]);

  tray.setContextMenu(contextMenu);
}

function sendSystemNotification(meeting) {
  playSound(); // Start playing sound

  const notification = new Notification({
    title: "Meeting Reminder",
    body: `${meeting.title} at ${meeting.time}`,
    silent: false // Allow system sound
  });

  notification.on("click", () => {
    shell.openExternal(meeting.link);
    stopSound(); // Stop sound when clicked
  });

  notification.on("close", () => {
    stopSound(); // Stop sound when notification is closed
  });

  notification.show();
}

function playSound() {
  const soundPath = path.join(__dirname, "chime.m4a");
  soundProcess = exec(`afplay "${soundPath}"`);
}

function stopSound() {
  if (soundProcess) {
    soundProcess.kill();
    soundProcess = null;
  }
}
