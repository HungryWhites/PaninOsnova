const express = require("express");
const multer = require("multer");
const path = require("path");
const adminRouter = express.Router();
const { checkAuth } = require("../models/user");
const { getUserById, getUsers } = require("../db/users");
const { getAllCompanies, updateCompany } = require("../db/companies");
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require("../db/products");
const { createCategory, updateCategory, deleteCategory } = require("../db/categories");
const { getAllOrders, updateOrderStatus } = require("../db/orders");
const { NotAllowedError } = require("../errors");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const requireAdmin = async (req) => {
  const token = req.cookies.token;
  const userId = await checkAuth(token);
  const user = await getUserById(userId);
  if (!user.isSystemAdmin) {
    throw new NotAllowedError("Доступ запрещён");
  }
  return user;
};

adminRouter.get("/companies", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const companies = await getAllCompanies();
    res.status(200).json(companies);
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/companies/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const company = await updateCompany(req.params.id, req.body);
    res.status(200).json(company);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const orders = await getAllOrders();
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/orders/:id/status", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const order = await updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/products", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const result = await getAllProducts({ includeInactive: true });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/products", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const product = await createProduct(req.body);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/products/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const product = await updateProduct(req.params.id, req.body);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/products/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    await deleteProduct(req.params.id);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/products/:id/image", upload.single("image"), async (req, res, next) => {
  try {
    await requireAdmin(req);
    if (!req.file) {
      return res.status(400).json({ message: "Файл не загружен" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const product = await updateProduct(req.params.id, { image: imageUrl });
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/categories", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const cat = await createCategory(req.body);
    res.status(200).json(cat);
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/categories/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const cat = await updateCategory(req.params.id, req.body);
    res.status(200).json(cat);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/categories/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    await deleteCategory(req.params.id);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = adminRouter;
