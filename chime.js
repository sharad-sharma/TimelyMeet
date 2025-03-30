const { app, Menu, Tray, shell, Notification, nativeImage } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const { authorize, getUpcomingEvents } = require("./google-calendar");

let tray = null;
let soundProcess = null;
let meetings = [];

const dummyMeetings = [
  { title: "Daily Standup", time: "11:00 AM", link: "https://zoom.us/j/123456" }
];

app.whenReady().then(() => {
  createTray();
  authorize((auth) => {
    getUpcomingEvents(auth, (events) => {
      meetings = events;
      updateTrayMenu();
      scheduleNotifications();
    });
  });

  // Trigger system notification after 10 seconds
  setTimeout(() => {
    sendSystemNotification(meetings[0]);
  }, 10000);
});

function createTray() {
  // create a new native image from icon
  const icon = nativeImage.createFromPath('./media/icon.jpg');
  // if you want to resize it, be careful, it creates a copy
  const trayIcon = icon.resize({ width: 16 });
  // here is the important part (has to be set on the resized version)
  trayIcon.setTemplateImage(true);

  tray = new Tray(trayIcon)
  // tray = new Tray(path.join(__dirname, "icon.jpg"));
  tray.setToolTip("MeetingBar Clone");
  // tray.setTitle(" 📅");
  updateTrayMenu();
}

function updateTrayMenu() {
  const menuItems = meetings.map((meeting) => ({
    label: `${meeting.title} - ${meeting.time}`,
    click: () => shell.openExternal(meeting.link),
  }));

  const contextMenu = Menu.buildFromTemplate([
    { label: "Upcoming Meetings", enabled: false },
    { type: "separator" },
    ...menuItems,
    { type: "separator" },
    { label: "Quit", role: "quit" },
  ]);

  tray.setContextMenu(contextMenu);
}

function scheduleNotifications() {
  meetings.forEach((meeting) => {
    const meetingTime = new Date(meeting.time).getTime();
    const now = Date.now();
    const timeUntilMeeting = meetingTime - now;

    if (timeUntilMeeting > 0) {
      console.log("scheduling notif for", timeUntilMeeting);
      setTimeout(() => sendSystemNotification(meeting), timeUntilMeeting);
    }
  });
}

function sendSystemNotification(meeting) {
  playSound();

  const notification = new Notification({
    title: "Meeting Reminder",
    body: `${meeting.title} at ${meeting.time}`,
    silent: false,
  });

  notification.on("click", () => {
    shell.openExternal(meeting.link);
    stopSound();
  });

  notification.on("close", () => {
    stopSound();
  });

  notification.show();
}

function playSound() {
  const soundPath = path.join(__dirname, "media", "chime.m4a");
  soundProcess = exec(`afplay "${soundPath}"`);
}

function stopSound() {
  if (soundProcess) {
    soundProcess.kill();
    soundProcess = null;
  }
}
