const express = require("express");
const ordersRouter = express.Router();
const { createOrder, getOrdersByUser, getOrdersByCompany, getOrderById, getAllOrders, updateOrderStatus } = require("../db/orders");
const { getCartByUser, clearCart } = require("../db/cart");
const { checkAuth } = require("../models/user");
const { getUserById } = require("../db/users");

ordersRouter.post("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);
    const cartItems = await getCartByUser(userId);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    const priceCategory = user.Company ? user.Company.priceCategory : "base";
    const items = cartItems.map((ci) => {
      const product = ci.Product;
      let price = product.basePrice;
      if (priceCategory === "wholesale" && product.wholesalePrice) {
        price = product.wholesalePrice;
      } else if (priceCategory === "vip" && product.vipPrice) {
        price = product.vipPrice;
      }
      return {
        productId: product.id,
        quantity: ci.quantity,
        price,
        productName: product.name,
        productSku: product.sku,
      };
    });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (totalAmount < 50000) {
      return res.status(400).json({
        message: `Минимальная сумма заказа 50 000 ₽. Текущая сумма: ${totalAmount.toLocaleString("ru-RU")} ₽`,
      });
    }

    const order = await createOrder(userId, user.CompanyId, items, {
      comment: req.body.comment,
      contactPhone: req.body.contactPhone || user.phone,
      deliveryAddress: req.body.deliveryAddress,
    });

    await clearCart(userId);
    res.status(200).json({ ok: true, order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);

    let orders;
    if (user.isSystemAdmin) {
      orders = await getAllOrders();
    } else if (user.role === "admin") {
      orders = await getOrdersByCompany(user.CompanyId);
    } else {
      orders = await getOrdersByUser(userId);
    }

    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    await checkAuth(token);
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.put("/:id/status", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);
    if (!user.isSystemAdmin) {
      return res.status(403).json({ message: "Доступ запрещён" });
    }
    const order = await updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = ordersRouter;
