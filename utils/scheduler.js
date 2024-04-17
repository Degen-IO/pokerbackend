const cron = require("node-cron");
const { Op } = require("sequelize");
const { Mutation } = require("../schemas/resolvers");
const { CashGame, TournamentGame } = require("../models");

//***** is cron syntax */
cron.schedule("* * * * *", async () => {
  try {
    const currentDateTimeUTC = new Date();
    const oneMinuteBeforeStart = new Date(currentDateTimeUTC.getTime() + 60000);

    // Find games waiting to start
    const waitingCashGames = await CashGame.findAll({
      where: {
        status: "waiting",
        startDateTime: {
          [Op.between]: [
            new Date(oneMinuteBeforeStart.getTime() - 60000), // One minute behind
            oneMinuteBeforeStart, // One minute ahead
          ],
        },
      },
    });

    const waitingTournamentGames = await TournamentGame.findAll({
      where: {
        status: "waiting",
        startDateTime: {
          [Op.between]: [
            new Date(oneMinuteBeforeStart.getTime() - 60000), // One minute behind
            oneMinuteBeforeStart, // One minute ahead
          ],
        },
      },
    });

    // Update status to "starting" for the found games
    for (const cashGame of waitingCashGames) {
      try {
        await Mutation.updateGameStatus("", {
          gameId: cashGame.cashId,
          gameType: "cash",
          status: "starting",
        });
      } catch (error) {
        console.error("Error updating game status:", error);
      }
    }

    for (const tournamentGame of waitingTournamentGames) {
      try {
        await Mutation.updateGameStatus("", {
          gameId: tournamentGame.tournamentId,
          gameType: "tournament",
          status: "starting",
        });
      } catch (error) {
        console.error("Error updating game status:", error);
      }
    }

    // Schedule another task to update status from "starting" to "ongoing" after a minute
    setTimeout(async () => {
      for (const cashGame of waitingCashGames) {
        try {
          await Mutation.updateGameStatus("", {
            gameId: cashGame.cashId,
            gameType: "cash",
            status: "ongoing",
          });
        } catch (error) {
          console.error("Error updating game status:", error);
        }
      }

      for (const tournamentGame of waitingTournamentGames) {
        try {
          await Mutation.updateGameStatus("", {
            gameId: tournamentGame.tournamentId,
            gameType: "tournament",
            status: "ongoing",
          });
        } catch (error) {
          console.error("Error updating game status:", error);
        }
      }
    }, 60000);
  } catch (error) {
    console.error("Failed to update game status:", error);
  }
});

console.log("Scheduler started...");
