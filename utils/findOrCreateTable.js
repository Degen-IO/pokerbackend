const { Table, Player } = require("../models");

module.exports = {
  findOrCreateTable: async function (game, gameType) {
    // console.log("----------------------game: " + game);
    // console.log("----------------------game.gameId: " + game.gameId);
    // console.log("----------------------game.gameType: " + game.gameType);
    // Find all existing tables with available seats for the game
    const existingTables = await Table.findAll({
      where: {
        gameId: game.gameId,
        gameType: gameType,
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
      gameId: game.gameId,
      gameType: game.gameType,
    });

    // Fetch players separately for the new table (empty array)
    const newTablePlayers = await Player.findAll({
      where: {
        tableId: newTable.tableId,
      },
    });

    // Attach players to the new table
    newTable.players = newTablePlayers;

    return newTable;
  },
};
