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
  // setTimeout(() => {
  //   sendSystemNotification(dummyMeetings[0]);
  // }, 10000);
});

function createTray() {
  const iconPath = path.join(__dirname, "media", "icon.jpg");
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16 });

  trayIcon.setTemplateImage(true); // Ensure it's visible in dark mode
  tray = new Tray(trayIcon);
  tray.setToolTip("MeetingBar Clone");
  // tray.setTitle(" 📅");
  updateTrayMenu();
}

function isMeetingStarted(meetingStartTime) {
  return new Date(meetingStartTime).getTime() <= Date.now();
}

function updateTrayMenu() {
  const zoomIcon = nativeImage.createFromPath(path.join(__dirname, "media/zoom.png")).resize({ width: 16, height: 16 });
  const menuItems = meetings.map(({ start, end, title, link }) => {
    const formatTime = (date) => {
      const d = new Date(date);
      return d.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    };
  
    // Format time and ensure alignment using padStart()
    const isZoom = link.includes("zoom.us");
    const startTime = formatTime(start).padStart((isZoom ? 0 : 11), " ");
    const endTime = formatTime(end).padStart(15, " ");
    const runningIcon = isMeetingStarted(start) ? "🏃" : "";

    return {
      label: `${startTime} ${endTime}        ${title} ${runningIcon}`,
      icon: isZoom ? zoomIcon : null,
      click: () => shell.openExternal(link),
    };
  });

  const runningMeetings = meetings.filter(meeting => isMeetingStarted(meeting.start) && meeting.status === "confirmed" && meeting.title != "Home");
  console.log("running meetings:", runningMeetings);
  if (runningMeetings && runningMeetings.length > 0) {
    tray.setTitle(runningMeetings[0].title);
  }

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
