const bcrypt = require("bcryptjs");

const getUserModel = (sequelize, { DataTypes }) => {
  const User = sequelize.define("user", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 255], // Minimum length of 5 characters
      },
    },
    chip_stack: {
      type: DataTypes.DECIMAL(10, 2), // Example data type for chip stacks
      allowNull: false,
      defaultValue: 0, // Default chip stack value
    },
  });

  // Define associations with other models
  User.associate = (models) => {
    // User has many UserGroupRole associations
    User.hasMany(models.UserGroupRole, {
      foreignKey: "userId",
    });

    // User has many PokerGroup associations
    User.belongsToMany(models.PokerGroup, {
      through: "UserGroupRole",
      foreignKey: "userId",
    });

    // User has many PokerGame associations
    User.hasMany(models.PokerGame, {
      foreignKey: "userId",
    });

    // User has many PlayerHand associations
    User.hasMany(models.PlayerHand, {
      foreignKey: "userId",
    });

    // User has many PlayerAction associations
    User.hasMany(models.PlayerAction, {
      foreignKey: "userId",
    });
  };

  // set up beforeCreate hook to hash the password
  User.addHook("beforeCreate", async (user) => {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  });

  // Compare the incoming password with the hashed password
  User.prototype.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};

module.exports = { getUserModel };
