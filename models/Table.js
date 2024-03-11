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
    dealerSeat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Add polymorphic association fields
    gameableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameableType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  // Remove the direct belongsTo associations to CashGame and TournamentGame
  // since we're implementing polymorphic associations
  Table.associate = (models) => {
    // A table can have multiple players
    Table.hasMany(models.Player, { foreignKey: "tableId" });

    // Dynamic associations based on `gameableType` will be handled in the application logic
  };

  return Table;
};

module.exports = { getTableModel };
