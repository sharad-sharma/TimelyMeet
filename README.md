# ⏰ TimelyMeet

TimelyMeet is a lightweight, cross-platform meeting bar app built with Electron. It syncs with your Google Calendar to show your upcoming events and lets you join meetings with a single click — right from your system tray or menu bar.

But it’s more than just a passive calendar viewer — **TimelyMeet rings you**, shows a pop-up window, and gets you into the meeting, fast.

No more digging through calendars, emails, or chat threads. TimelyMeet keeps your schedule *and your calls* just a glance (and a click) away.

---

## ✨ Features

- 📅 Google Calendar integration (OAuth2)
- 🔔 Smart meeting reminders with sound and popup
- 🚀 One-click launch into any meeting link (Zoom, Meet, Teams, WebEx, etc.)
- 🪟 Always-on-top notification window at meeting time
- 🕒 Meeting countdown and LIVE indicator in the tray
- 💻 Works on macOS and Windows

---

## 🔔 Ring & Pop-up Experience

When your meeting is about to start, TimelyMeet does what a real assistant would:

- Plays a gentle **chime sound**
- Shows an always-on-top **BrowserWindow popup** with meeting info
- Lets you **click to join instantly** — no delays
- Tray title shows countdown or 🟢 **LIVE** when a meeting is ongoing

It’s not just a reminder — **it’s a meeting call**.

---

## 💡 How It Works

TimelyMeet scans your calendar for upcoming events with join links, intelligently extracts them, and presents them in your tray menu. When the time comes, you're alerted with sound + visuals — and one click takes you there.

---

## 🔐 Auth

TimelyMeet uses a secure OAuth2 flow to connect with your Google Calendar. Your token is stored locally via Electron's `app.getPath("userData")` — no cloud sync, no leaks.

---

## 🚧 Status

TimelyMeet is actively in development — lightweight by design, privacy-focused, and distraction-free.

Contributions, feedback, and feature requests are super welcome!
