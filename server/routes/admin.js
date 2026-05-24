const express = require("express");
const multer = require("multer");
const path = require("path");
const { nanoid } = require("nanoid");
const adminRouter = express.Router();
const { checkAuth } = require("../models/user");
const { getUserById, getUsers } = require("../db/users");
const { getAllCompanies, updateCompany } = require("../db/companies");
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require("../db/products");
const { createCategory, updateCategory, deleteCategory } = require("../db/categories");
const { getAllOrders, updateOrderStatus, getOrderById } = require("../db/orders");
const { NotAllowedError } = require("../errors");
const { generateInvoice } = require("../utils/invoice");
const { sendMail } = require("../utils/mailer");

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

const requireCompanyAdmin = async (req) => {
  const token = req.cookies.token;
  const userId = await checkAuth(token);
  const user = await getUserById(userId);
  if (!user.isSystemAdmin && user.role !== "admin") {
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

// ===== INVOICE GENERATION =====
adminRouter.post("/orders/:id/invoice", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    const { getDb } = require("../db/db");
    const company = await getDb().models.Company.findByPk(order.CompanyId);
    if (!company) return res.status(400).json({ message: "Компания не найдена" });

    const { filePath, fileName } = await generateInvoice(order, company);
    const invoicePath = `/invoices/${fileName}`;

    order.invoicePath = invoicePath;
    order.invoiceSentAt = new Date();
    order.status = "awaiting_payment";
    await order.save();

    // Send email to company
    const recipient = company.email || (order.User ? order.User.email : null);
    if (recipient) {
      await sendMail({
        to: recipient,
        subject: `Счёт на оплату ${order.orderNumber} — ТД ПРОМСТРОЙ`,
        text: `Добрый день!\n\nВам выставлен счёт на оплату по заказу ${order.orderNumber} на сумму ${order.totalAmount} руб.\nСчёт прикреплён к письму.\n\nС уважением,\nТД ПРОМСТРОЙ`,
        attachments: [{ filename: fileName, path: filePath }],
      });
    }

    res.status(200).json({ ok: true, invoicePath, status: "awaiting_payment" });
  } catch (err) {
    next(err);
  }
});

// Serve invoices
adminRouter.get("/invoices/:filename", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const filePath = path.join(__dirname, "../invoices", req.params.filename);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// ===== EMPLOYEE INVITES =====
adminRouter.post("/invites", async (req, res, next) => {
  try {
    const user = await requireCompanyAdmin(req);
    // Company admin can also invite if they are admin of their company
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: "Email обязателен" });
    const validRoles = ["buyer", "accountant"];
    const inviteRole = validRoles.includes(role) ? role : "buyer";

    const { getDb } = require("../db/db");
    const { getUserByEmail } = require("../db/users");
    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Пользователь с таким email уже существует" });

    const token = nanoid();
    const invite = await getDb().models.Invite.create({
      email,
      role: inviteRole,
      token,
      status: "pending",
      CompanyId: user.CompanyId || req.body.companyId,
      invitedBy: user.id,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const inviteLink = `${clientUrl}/registration?invite=${token}`;

    await sendMail({
      to: email,
      subject: "Приглашение в ТД ПРОМСТРОЙ — B2B платформа",
      text: `Здравствуйте!\n\nВас пригласили присоединиться к компании на платформе ТД ПРОМСТРОЙ.\nРоль: ${inviteRole === "accountant" ? "Бухгалтер" : "Менеджер закупок"}\n\nДля регистрации перейдите по ссылке:\n${inviteLink}\n\nС уважением,\nТД ПРОМСТРОЙ`,
      html: `<p>Здравствуйте!</p><p>Вас пригласили присоединиться к компании на платформе ТД ПРОМСТРОЙ.</p><p>Роль: <strong>${inviteRole === "accountant" ? "Бухгалтер" : "Менеджер закупок"}</strong></p><p><a href="${inviteLink}" style="display:inline-block;padding:12px 28px;background:#D4A853;color:#fff;text-decoration:none;border-radius:8px;">Зарегистрироваться</a></p>`,
    });

    res.status(200).json({ ok: true, invite, inviteLink });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/invites", async (req, res, next) => {
  try {
    const user = await requireCompanyAdmin(req);
    const { getDb } = require("../db/db");
    const where = {};
    if (!user.isSystemAdmin && user.CompanyId) where.CompanyId = user.CompanyId;
    const invites = await getDb().models.Invite.findAll({ where, order: [["createdAt", "DESC"]] });
    res.status(200).json(invites);
  } catch (err) {
    next(err);
  }
});

// ===== COMPANY PRICES =====
adminRouter.get("/company-prices/:companyId", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { getDb } = require("../db/db");
    const prices = await getDb().models.CompanyPrice.findAll({
      where: { CompanyId: req.params.companyId },
      include: "Product",
    });
    res.status(200).json(prices);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/company-prices", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { companyId, productId, price } = req.body;
    if (!companyId || !productId || !price) {
      return res.status(400).json({ message: "companyId, productId и price обязательны" });
    }
    const { getDb } = require("../db/db");
    // Upsert
    const existing = await getDb().models.CompanyPrice.findOne({
      where: { CompanyId: companyId, ProductId: productId },
    });
    if (existing) {
      existing.price = price;
      await existing.save();
      return res.status(200).json(existing);
    }
    const cp = await getDb().models.CompanyPrice.create({
      CompanyId: companyId,
      ProductId: productId,
      price,
    });
    res.status(200).json(cp);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/company-prices/:id", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { getDb } = require("../db/db");
    const cp = await getDb().models.CompanyPrice.findByPk(req.params.id);
    if (cp) await cp.destroy();
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ===== REPORTS =====
adminRouter.get("/reports/sales", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { getDb } = require("../db/db");
    const Order = getDb().models.Order;

    // Get all delivered orders
    const deliveredOrders = await Order.findAll({
      where: { status: "delivered" },
      raw: true,
    });

    // Compute monthly stats in JS (reliable with SQLite)
    const monthMap = {};
    let totalRevenue = 0;
    for (const order of deliveredOrders) {
      const date = new Date(order.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[month]) monthMap[month] = { month, orderCount: 0, totalRevenue: 0 };
      monthMap[month].orderCount++;
      monthMap[month].totalRevenue += order.totalAmount || 0;
      totalRevenue += order.totalAmount || 0;
    }

    const sales = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    const totalOrders = deliveredOrders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.status(200).json({ sales, totalOrders, totalRevenue, avgOrder });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/reports/categories", async (req, res, next) => {
  try {
    await requireAdmin(req);
    const { getDb } = require("../db/db");
    const Order = getDb().models.Order;
    const OrderItem = getDb().models.OrderItem;
    const Product = getDb().models.Product;
    const Category = getDb().models.Category;

    // Get delivered order IDs
    const deliveredOrders = await Order.findAll({
      where: { status: "delivered" },
      attributes: ["id"],
      raw: true,
    });
    const deliveredIds = deliveredOrders.map((o) => o.id);

    if (deliveredIds.length === 0) {
      return res.status(200).json({ topProducts: [], categories: [] });
    }

    // Get order items for delivered orders
    const items = await OrderItem.findAll({
      where: { OrderId: deliveredIds },
      include: [{ model: Product, include: [{ model: Category }] }],
    });

    // Aggregate by product
    const productMap = {};
    for (const item of items) {
      const pid = item.ProductId;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: item.Product?.name || "—",
          sku: item.Product?.sku || "—",
          category: item.Product?.Category?.name || "Без категории",
          categoryId: item.Product?.CategoryId,
          totalQty: 0,
          totalRevenue: 0,
          orderCount: 0,
        };
      }
      productMap[pid].totalQty += item.quantity;
      productMap[pid].totalRevenue += item.quantity * item.price;
      productMap[pid].orderCount++;
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 20);

    // Aggregate by category
    const catStats = {};
    for (const p of Object.values(productMap)) {
      const catName = p.category;
      if (!catStats[catName]) catStats[catName] = { name: catName, totalQty: 0, totalRevenue: 0, productCount: 0 };
      catStats[catName].totalQty += p.totalQty;
      catStats[catName].totalRevenue += p.totalRevenue;
      catStats[catName].productCount++;
    }

    res.status(200).json({
      topProducts,
      categories: Object.values(catStats).sort((a, b) => b.totalRevenue - a.totalRevenue),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = adminRouter;
