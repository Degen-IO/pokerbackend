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
  });

  Table.associate = (models) => {
    // A table belongs to a CashGame or TournamentGame
    Table.belongsTo(models.CashGame, { foreignKey: "cashId" });
    Table.belongsTo(models.TournamentGame, { foreignKey: "tournamentId" });

    // A table can have multiple players
    Table.hasMany(models.Player, { foreignKey: "tableId" });
  };

  return Table;
};

module.exports = { getTableModel };
