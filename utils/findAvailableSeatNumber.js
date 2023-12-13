module.exports = {
  findAvailableSeatNumber: function (assignedSeatNumbers, playersPerTable) {
    // Create an array representing all possible seat numbers
    const allSeatNumbers = Array.from(
      { length: playersPerTable },
      (_, index) => index + 1
    );

    // Filter out the assigned seat numbers
    const availableSeatNumbers = allSeatNumbers.filter(
      (seatNumber) => !assignedSeatNumbers.includes(seatNumber)
    );

    // If there are available seat numbers, return the first one; otherwise, return null
    return availableSeatNumbers.length > 0 ? availableSeatNumbers[0] : null;
  },
};
