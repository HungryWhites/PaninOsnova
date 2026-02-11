const { getUserIdByToken } = require("../db/tokens");
const { AuthError } = require("../errors");
const { DataTypes } = require("sequelize");

const User = (sequelize) =>
  sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patronymic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "admin",
    },
    isSystemAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

module.exports = {
  User,
  checkAuth: async (token) => {
    const userId = await getUserIdByToken(token);
    if (!userId) {
      throw new AuthError("Пользователь не авторизован");
    }
    return userId;
  },
};