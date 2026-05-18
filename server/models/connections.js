const createConnections = (sequelize) => {
  const { User, Token, Company, Product, Category, CartItem, Order, OrderItem, Invite, CompanyPrice } =
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

  Company.hasMany(Invite);
  Invite.belongsTo(Company);

  User.hasMany(Invite, { foreignKey: "invitedBy" });

  Company.hasMany(CompanyPrice);
  CompanyPrice.belongsTo(Company);

  Product.hasMany(CompanyPrice);
  CompanyPrice.belongsTo(Product);
};

module.exports = createConnections;