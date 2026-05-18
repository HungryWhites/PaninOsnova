const { DataTypes } = require("sequelize");

const CompanyPrice = (sequelize) =>
  sequelize.define("CompanyPrice", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  });

module.exports = { CompanyPrice };
