const bcrypt = require("bcrypt");

const getUserModel = (sequelize, { DataTypes }) => {
  const User = sequelize.define("user", {
    id: {
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
  });

  // Define an association with the Player model
  User.associate = (models) => {
    User.hasMany(models.Player);
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

  return User; // Export the User model
};

module.exports = { getUserModel };
