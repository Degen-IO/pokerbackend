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
  });

  Table.associate = (models) => {
    // A table belongs to a CashGame or TournamentGame
    Table.belongsTo(models.CashGame, { foreignKey: "gameId" });
    Table.belongsTo(models.TournamentGame, { foreignKey: "gameId" });

    // A table can have multiple players
    Table.hasMany(models.Player, { foreignKey: "tableId" });
  };

  return Table;
};

module.exports = { getTableModel };
