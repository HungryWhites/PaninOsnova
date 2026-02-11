const { getDb } = require("./db");

const generateOrderNumber = () => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ПС-${y}${m}${d}-${rand}`;
};

module.exports = {
  createOrder: async (userId, companyId, items, data = {}) => {
    const orderNumber = generateOrderNumber();
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }
    const order = await getDb().models.Order.create({
      orderNumber,
      status: "new",
      totalAmount,
      comment: data.comment || null,
      contactPhone: data.contactPhone || null,
      deliveryAddress: data.deliveryAddress || null,
      UserId: userId,
      CompanyId: companyId,
    });
    for (const item of items) {
      await getDb().models.OrderItem.create({
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        productSku: item.productSku,
        OrderId: order.id,
        ProductId: item.productId,
      });
    }
    return order;
  },
  getOrdersByCompany: async (companyId) => {
    return await getDb().models.Order.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: getDb().models.OrderItem, include: ["Product"] },
        "User",
      ],
      order: [["createdAt", "DESC"]],
    });
  },
  getOrdersByUser: async (userId) => {
    return await getDb().models.Order.findAll({
      where: { UserId: userId },
      include: [
        { model: getDb().models.OrderItem, include: ["Product"] },
      ],
      order: [["createdAt", "DESC"]],
    });
  },
  getAllOrders: async () => {
    return await getDb().models.Order.findAll({
      include: [
        { model: getDb().models.OrderItem },
        "User",
        "Company",
      ],
      order: [["createdAt", "DESC"]],
    });
  },
  getOrderById: async (id) => {
    return await getDb().models.Order.findByPk(id, {
      include: [
        { model: getDb().models.OrderItem, include: ["Product"] },
        "User",
        "Company",
      ],
    });
  },
  updateOrderStatus: async (id, status) => {
    const order = await getDb().models.Order.findByPk(id);
    if (order) {
      order.status = status;
      await order.save();
    }
    return order;
  },
};
