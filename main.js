const { app, Menu, Tray, shell, Notification, nativeImage, BrowserWindow } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const { authorize, getUpcomingEvents } = require("./google-calendar");
const fs = require("fs");

let tray = null;
let soundProcess = null;
let meetings = [];
let notifWindow = null; // 🆕 Added

const dummyMeetings = [
  { title: "Daily Standup", time: "2025-04-07T11:00:00+05:30", start: "2025-04-07T11:00:00+05:30", end: "2025-04-07T12:00:00+05:30", link: "https://zoom.us/j/123456" }
];

app.on("window-all-closed", (e) => {
  // Prevent quitting the app when all windows are closed
  e.preventDefault();
});

const { ipcMain } = require("electron");

ipcMain.on("open-external", (event, url) => {
  if (url) {
    shell.openExternal(url);
  }
});

ipcMain.on("dismiss-notification", () => {
  if (notifWindow) {
    notifWindow.close();     // Close the popup window
    notifWindow = null;
  }

  stopSound();               // Stop any ongoing sound
});


app.whenReady().then(() => {
  createTray();
  authorize((auth) => {
    // Fetch events immediately
    fetchAndUpdateEvents(auth);

    // Set interval to fetch events regularly (every 5 minutes)
    setInterval(() => fetchAndUpdateEvents(auth), 5 * 60 * 1000); // 5 min
  });

  setInterval(updateTrayMenu, 1000 * 30);
  setTimeout(() => {
    sendSystemNotification(dummyMeetings[0]);
  }, 10000);
});

// Function to fetch and update events
function fetchAndUpdateEvents(auth) {
  getUpcomingEvents(auth, (events) => {
    meetings = events;
    updateTrayMenu();
    scheduleNotifications();
  });
}

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

  const upcomingMeeting = meetings.filter(meeting => meeting.status === "confirmed" && meeting.title != "Home");

  console.log("upcoming meetings:", upcomingMeeting);

  if (upcomingMeeting && upcomingMeeting.length > 0) {
    const nextMeeting = upcomingMeeting[0];
    const startTime = new Date(nextMeeting.start);

    // Calculate the time difference in seconds
    const timeDiff = Math.round((startTime.getTime() - Date.now()) / 1000);

    // Convert time into a readable format (smart formatting)
    let timeDisplay;
    if (timeDiff < 60) {
      timeDisplay = `${timeDiff}s`;  // Show seconds if less than 1 min
    } else if (timeDiff < 3600) {
      timeDisplay = `${Math.floor(timeDiff / 60)}m`;  // Show minutes if less than 1 hr
    } else {
      timeDisplay = `${Math.floor(timeDiff / 3600)}h`;  // Show hours if more than 1 hr
    }

    // Format the title
    let title = ` ${nextMeeting.title}`;
    if (timeDiff > 0) {
      title += ` ⏳ in ${timeDisplay}`;
    } else {
      title += ` 🟢 LIVE`;
    }

    // Update the menu bar title
    tray.setTitle(title);
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

const scheduledNotifications = [];

function scheduleNotifications() {
  scheduledNotifications.forEach(clearTimeout);
  scheduledNotifications.length = 0; // Reset the array

  meetings.forEach((meeting) => {
    const meetingTime = new Date(meeting.start).getTime(); // Use 'start' instead of 'time'
    const now = Date.now();
    const timeUntilMeeting = meetingTime - now;

    if (timeUntilMeeting > 0) {
      console.log("Scheduling notification for", timeUntilMeeting);
      const scheduledNotif = setTimeout(() => sendSystemNotification(meeting), timeUntilMeeting);
      scheduledNotifications.push(scheduledNotif);
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
    if (notifWindow) notifWindow.close(); // 🆕 Added
  });

  notification.on("close", () => {
    stopSound();
    if (notifWindow) notifWindow.close(); // 🆕 Added
  });

  notification.show();

  // 🆕 Show popup window with meeting info
  createMeetingWindow(meeting); // 🆕 Added
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

// 🆕 Added: create window to show meeting info
function createMeetingWindow(meeting) {
  if (notifWindow) {
    notifWindow.close(); // Close previous one if open
  }

  notifWindow = new BrowserWindow({
    width: 360,
    height: 220,
    title: "Upcoming Meeting",
    alwaysOnTop: true,
    resizable: true,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 🆕 Required for ipcRenderer
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  notifWindow.loadFile(path.join(__dirname, "meeting.html"));

  notifWindow.once("ready-to-show", () => {
    notifWindow.webContents.send("meeting-data", meeting);
  });

  notifWindow.on("closed", () => {
    notifWindow = null;
  });
}