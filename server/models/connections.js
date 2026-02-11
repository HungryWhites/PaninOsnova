const createConnections = (sequelize) => {
  const { User, Token, Company, Product, Category, CartItem, Order, OrderItem } =
    sequelize.models;

  User.hasOne(Token);
  Token.belongsTo(User);

  Company.hasMany(User);
  User.belongsTo(Company);

  Category.hasMany(Product);
  Product.belongsTo(Category);

  User.hasMany(CartItem);
  CartItem.belongsTo(User);

  Product.hasMany(CartItem);
  CartItem.belongsTo(Product);

  Company.hasMany(Order);
  Order.belongsTo(Company);

  User.hasMany(Order);
  Order.belongsTo(User);

  Order.hasMany(OrderItem);
  OrderItem.belongsTo(Order);

  Product.hasMany(OrderItem);
  OrderItem.belongsTo(Product);
};

module.exports = createConnections;