const { DateTime } = require("luxon");

const validateStartTime = async (cashGame) => {
  const { startDate, startTime } = cashGame;
  const currentDateTime = DateTime.local();
  console.log("Current Date/Time:", currentDateTime.toISO());

  const startDateTime = DateTime.fromSQL(`${startDate}T${startTime}:00`);
  console.log("Start Date/Time:", startDateTime.toISO());

  const minStartTime = currentDateTime.plus({ minutes: 5 });
  console.log("Minimum Start Time:", minStartTime.toISO());

  if (startDateTime < minStartTime) {
    console.error("Start time must be at least 5 minutes in the future.");
    throw new Error("Start time must be at least 5 minutes in the future.");
  }
};

module.exports = {
  validateStartTime,
};
