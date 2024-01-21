const cron = require("node-cron");
const { Op } = require("sequelize");
const { Mutation } = require("../schemas/resolvers");
const { CashGame, TournamentGame } = require("../models");

const windowSizeMilliseconds = 3000; // 3 seconds

//***** is cron syntax */
cron.schedule("* * * * *", async () => {
  try {
    const currentDateTimeUTC = new Date();
    const startDateTimeCondition = {
      [Op.between]: [
        new Date(currentDateTimeUTC.getTime() - windowSizeMilliseconds),
        new Date(currentDateTimeUTC.getTime() + windowSizeMilliseconds),
      ],
    };

    const waitingCashGames = await CashGame.findAll({
      where: {
        status: "waiting",
        startDateTime: startDateTimeCondition,
      },
    });

    const waitingTournamentGames = await TournamentGame.findAll({
      where: {
        status: "waiting",
        startDateTime: startDateTimeCondition,
      },
    });

    //we pass an empty string as the parent argument
    for (const cashGame of waitingCashGames) {
      try {
        await Mutation.updateGameStatus("", {
          gameId: cashGame.gameId,
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
          gameId: tournamentGame.gameId,
          gameType: "tournament",
          status: "ongoing",
        });
      } catch (error) {
        console.error("Error updating game status:", error);
      }
    }
  } catch (error) {
    console.error("Failed to update game status:", error);
  }
});

console.log("Scheduler started...");
