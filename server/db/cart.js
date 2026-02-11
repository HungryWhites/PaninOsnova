const { getDb } = require("./db");

module.exports = {
  getCartByUser: async (userId) => {
    return await getDb().models.CartItem.findAll({
      where: { UserId: userId },
      include: [
        {
          model: getDb().models.Product,
          include: ["Category"],
        },
      ],
    });
  },
  addToCart: async (userId, productId, quantity) => {
    const existing = await getDb().models.CartItem.findOne({
      where: { UserId: userId, ProductId: productId },
    });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return existing;
    }
    return await getDb().models.CartItem.create({
      UserId: userId,
      ProductId: productId,
      quantity,
    });
  },
  updateCartItem: async (id, userId, quantity) => {
    const item = await getDb().models.CartItem.findOne({
      where: { id, UserId: userId },
    });
    if (item) {
      item.quantity = quantity;
      await item.save();
    }
    return item;
  },
  removeFromCart: async (id, userId) => {
    await getDb().models.CartItem.destroy({
      where: { id, UserId: userId },
    });
  },
  clearCart: async (userId) => {
    await getDb().models.CartItem.destroy({
      where: { UserId: userId },
    });
  },
};
