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

// User edits own order (only if new or awaiting_contact)
ordersRouter.put("/:id/edit", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }
    if (order.UserId !== userId) {
      return res.status(403).json({ message: "Это не ваш заказ" });
    }
    if (!["new", "awaiting_contact"].includes(order.status)) {
      return res.status(400).json({ message: "Заказ нельзя изменить в текущем статусе" });
    }

    const { items, comment } = req.body;
    const { getDb } = require("../db/db");
    const OrderItem = getDb().models.OrderItem;

    // Update comment if provided
    if (comment !== undefined) {
      order.comment = comment;
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete removed items, update quantities
      for (const oi of order.OrderItems) {
        const updated = items.find((i) => i.id === oi.id);
        if (!updated || updated.quantity <= 0) {
          await oi.destroy();
        } else if (updated.quantity !== oi.quantity) {
          oi.quantity = updated.quantity;
          await oi.save();
        }
      }

      // Recalculate total
      const remaining = await OrderItem.findAll({ where: { OrderId: order.id } });
      if (remaining.length === 0) {
        // If all items removed, cancel the order
        order.status = "cancelled";
        order.totalAmount = 0;
        await order.save();
        return res.status(200).json({ ok: true, message: "Все товары удалены, заказ отменён" });
      }
      let total = 0;
      for (const r of remaining) {
        total += r.price * r.quantity;
      }
      order.totalAmount = total;
    }

    await order.save();

    // Return updated order
    const updated = await getOrderById(order.id);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// User cancels own order (only if new or awaiting_contact)
ordersRouter.put("/:id/cancel", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }
    if (order.UserId !== userId) {
      return res.status(403).json({ message: "Это не ваш заказ" });
    }
    if (!["new", "awaiting_contact"].includes(order.status)) {
      return res.status(400).json({ message: "Заказ нельзя отменить в текущем статусе" });
    }
    const updated = await updateOrderStatus(req.params.id, "cancelled");
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = ordersRouter;
