const express = require("express");
const cors = require("cors");
const cookies = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const adminRouter = require("./routes/admin");
const { initDb } = require("./db/db");
const { seedDatabase } = require("./db/seed");

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(cookies());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.status(200).json({ ok: true, name: "ПРОМСТРОЙ B2B API" });
});

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);

app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(async function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;
  res.status(err.status || 500);
  res.json({ error: err.message });
});

const port = process.env.PORT || 3001;
(async () => {
  await initDb();
  await seedDatabase();
  app.listen(port, () => {
    console.log(`ПРОМСТРОЙ B2B API running on port ${port}`);
  });
})();
