const getTableModel = (sequelize, { DataTypes }) => {
  const Table = sequelize.define("table", {
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    isActiveHand: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Initially set to false
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dealerSeat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cashGameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "CashGame", // Name of the table as defined in the database
        key: "gameId", // Key in CashGame that cashGameId refers to
      },
    },
    tournamentGameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "TournamentGame", // Name of the table as defined in the database
        key: "gameId", // Key in TournamentGame that tournamentGameId refers to
      },
    },
  });

  Table.associate = (models) => {
    Table.belongsTo(models.CashGame, {
      foreignKey: "cashGameId",
      as: "cashGame",
    });
    Table.belongsTo(models.TournamentGame, {
      foreignKey: "tournamentGameId",
      as: "tournamentGame",
    });
    // A table can have multiple players
    Table.hasMany(models.Player, { foreignKey: "tableId" });
  };

  return Table;
};

module.exports = { getTableModel };
