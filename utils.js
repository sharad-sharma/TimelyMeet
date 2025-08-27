const { screen } = require("electron");

function calculateNotificationWindowPosition(notifWindows) {
  const windowWidth = 360;
  const windowHeight = 220;
  const verticalOffset = 10;
  const horizontalOffset = 20;

  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH, x: screenX, y: screenY } = display.workArea;

  let posX, posY;

  if (notifWindows.length === 0) {
    // First window - center it
    posX = screenX + Math.floor((screenW - windowWidth) / 2);
    posY = screenY + Math.floor((screenH - windowHeight) / 2);
  } else {
    // Stagger subsequent ones diagonally down/right from center
    posX = screenX + Math.floor((screenW - windowWidth) / 2) + notifWindows.length * horizontalOffset;
    posY = screenY + Math.floor((screenH - windowHeight) / 2) + notifWindows.length * verticalOffset;

    // Clamp so it doesn't go off screen
    posX = Math.min(posX, screenX + screenW - windowWidth - 20);
    posY = Math.min(posY, screenY + screenH - windowHeight - 20);
  }
  return {posX, posY};
}

function isFullDayMeeting(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if the meeting spans the entire day
  return (
    startDate.getHours() === 5 &&
    startDate.getMinutes() === 30 &&
    endDate.getHours() === 5 &&
    endDate.getMinutes() === 30
  );
}

module.exports = {
  calculateNotificationWindowPosition,
  isFullDayMeeting,
}
