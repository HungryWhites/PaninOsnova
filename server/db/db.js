const connections = require("../models/connections");
const { Sequelize } = require("sequelize");

let db;

const initDb = async () => {
  if (!db) {
    db = new Sequelize({
      dialect: "sqlite",
      storage: "database.db",
      logging: false,
    });
    const models = [
      require("../models/company").Company,
      require("../models/user").User,
      require("../models/token").Token,
      require("../models/category").Category,
      require("../models/product").Product,
      require("../models/cartItem").CartItem,
      require("../models/order").Order,
      require("../models/order").OrderItem,
    ];
    for (const model of models) {
      model(db);
    }
    connections(db);
    await db.sync();
  }
};

const getDb = () => db;

module.exports = {
  initDb,
  getDb,
};