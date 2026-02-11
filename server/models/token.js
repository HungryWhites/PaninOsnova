const {DataTypes} = require("sequelize");

const Token = sequelize => sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = {
    Token
}