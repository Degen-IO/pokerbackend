const { Table, Player } = require("../models");

module.exports = {
  findOrCreateTable: async function (game, gameType) {
    // Determine the correct gameableType based on gameType
    const gameableType = gameType === "cash" ? "cashGame" : "tournamentGame";

    // Find all existing tables with available seats for the game
    const existingTables = await Table.findAll({
      where: {
        gameableId: game.gameId, // Use the polymorphic field
        gameableType, // Use the determined gameableType
      },
      include: [Player], // Include players associated with each table
    });

    // Check if any existing table has available seats
    for (const existingTable of existingTables) {
      const playersCount = existingTable.players.length;
      if (playersCount < game.playersPerTable) {
        // Found a table with available seats
        return existingTable;
      }
    }

    // If no existing table with available seats, create a new table
    const newTable = await Table.create({
      gameableId: game.gameId, // Use the polymorphic field
      gameableType, // Use the determined gameableType
      // Ensure you set other necessary attributes for a new table, if any
    });

    // Fetch players separately for the new table (empty array)
    // Note: This step might be unnecessary if the table has just been created
    // and therefore has no players associated with it yet.
    const newTablePlayers = await Player.findAll({
      where: {
        tableId: newTable.tableId,
      },
    });

    // Attach players to the new table
    // Note: Since the table is new, this will always be an empty array,
    // but it's here to show how you might populate the players if needed.
    newTable.players = newTablePlayers;

    return newTable;
  },
};
