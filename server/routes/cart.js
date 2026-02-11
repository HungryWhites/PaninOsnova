const express = require("express");
const cartRouter = express.Router();
const { getCartByUser, addToCart, updateCartItem, removeFromCart, clearCart } = require("../db/cart");
const { checkAuth } = require("../models/user");
const { getUserById } = require("../db/users");
const { getProductById } = require("../db/products");

cartRouter.get("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);
    const items = await getCartByUser(userId);

    const priceCategory = user.Company ? user.Company.priceCategory : "base";
    const cartItems = items.map((item) => {
      const ci = item.toJSON();
      const product = ci.Product;
      if (priceCategory === "wholesale" && product.wholesalePrice) {
        ci.unitPrice = product.wholesalePrice;
      } else if (priceCategory === "vip" && product.vipPrice) {
        ci.unitPrice = product.vipPrice;
      } else {
        ci.unitPrice = product.basePrice;
      }
      ci.totalPrice = ci.unitPrice * ci.quantity;
      return ci;
    });

    const total = cartItems.reduce((sum, i) => sum + i.totalPrice, 0);
    res.status(200).json({ items: cartItems, total, count: cartItems.length });
  } catch (err) {
    next(err);
  }
});

cartRouter.post("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const { productId, quantity } = req.body;

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Недостаточно товара на складе" });
    }

    await addToCart(userId, productId, quantity || 1);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

cartRouter.put("/:id", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const { quantity } = req.body;
    await updateCartItem(req.params.id, userId, quantity);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

cartRouter.delete("/:id", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    await removeFromCart(req.params.id, userId);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

cartRouter.delete("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    await clearCart(userId);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = cartRouter;
