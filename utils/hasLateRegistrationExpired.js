module.exports = {
  hasLateRegistrationExpired: function (
    startDateTime,
    lateRegistrationDuration
  ) {
    const currentDateTime = new Date();
    const registrationEndTime = new Date(startDateTime);

    // Switch the enum value passed to a minutes value and add it to registrationEndTime
    switch (lateRegistrationDuration) {
      case "none":
        // If late registration is not allowed, the end time is the same as start time
        break;
      case "_30min":
        registrationEndTime.setMinutes(registrationEndTime.getMinutes() + 30);
        break;
      case "_60min":
        registrationEndTime.setMinutes(registrationEndTime.getMinutes() + 60);
        break;
      case "_90min":
        registrationEndTime.setMinutes(registrationEndTime.getMinutes() + 90);
        break;
      default:
        throw new Error("Invalid lateRegistrationDuration value");
    }
    // Return true or false so we know if they can join or not
    return currentDateTime > registrationEndTime;
  },
};
