const { DataTypes } = require("sequelize");

const Company = (sequelize) =>
  sequelize.define("Company", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "OOO",
    },
    inn: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
    },
    kpp: {
      type: DataTypes.STRING(9),
      allowNull: true,
    },
    ogrn: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    legalAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actualAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    priceCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "base",
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bik: {
      type: DataTypes.STRING(9),
      allowNull: true,
    },
    corrAccount: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    settlAccount: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  });

module.exports = { Company };
