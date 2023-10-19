const getUserGroupRoleModel = (sequelize, { DataTypes }) => {
  const UserGroupRole = sequelize.define("userGroupRole", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "member"), // Define valid role values
      allowNull: false,
    },
  });

  UserGroupRole.associate = (models) => {
    // Each UserGroupRole is associated with a specific user. A user can have multiple roles in various groups.
    UserGroupRole.belongsTo(models.User, { foreignKey: "userId" });

    //Each UserGroupRole is associated with a specific poker group. A poker group can have multiple user roles.
    UserGroupRole.belongsTo(models.PokerGroup, { foreignKey: "groupId" });
  };

  return UserGroupRole;
};

module.exports = { getUserGroupRoleModel };
