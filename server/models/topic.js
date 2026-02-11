const {DataTypes} = require("sequelize");

const Topic = sequelize => sequelize.define('Topic', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    theme: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = {
    Topic
}