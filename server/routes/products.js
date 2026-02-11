const express = require("express");
const { Op } = require("sequelize");
const productsRouter = express.Router();
const { getAllProducts, getProductById, getProductBySlug, getBrands } = require("../db/products");
const { checkAuth } = require("../models/user");
const { getUserById } = require("../db/users");

productsRouter.get("/", async (req, res, next) => {
  try {
    const filters = {
      categoryId: req.query.categoryId || null,
      brand: req.query.brand || null,
      search: req.query.search || null,
      minPrice: req.query.minPrice || null,
      maxPrice: req.query.maxPrice || null,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0,
    };
    const result = await getAllProducts(filters);

    let priceCategory = null;
    try {
      const token = req.cookies.token;
      if (token) {
        const userId = await checkAuth(token);
        const user = await getUserById(userId);
        if (user && user.Company) {
          priceCategory = user.Company.priceCategory;
        }
      }
    } catch (e) {}

    const products = result.rows.map((p) => {
      const prod = p.toJSON();
      if (priceCategory === "wholesale" && prod.wholesalePrice) {
        prod.displayPrice = prod.wholesalePrice;
      } else if (priceCategory === "vip" && prod.vipPrice) {
        prod.displayPrice = prod.vipPrice;
      } else if (priceCategory) {
        prod.displayPrice = prod.basePrice;
      } else {
        prod.displayPrice = null;
        prod.priceFrom = prod.basePrice;
      }
      return prod;
    });

    res.status(200).json({ products, total: result.count });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/brands", async (req, res, next) => {
  try {
    const brands = await getBrands();
    res.status(200).json(brands);
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    let product;
    if (isNaN(id)) {
      product = await getProductBySlug(id);
    } else {
      product = await getProductById(id);
    }
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const prod = product.toJSON();
    let priceCategory = null;
    try {
      const token = req.cookies.token;
      if (token) {
        const userId = await checkAuth(token);
        const user = await getUserById(userId);
        if (user && user.Company) {
          priceCategory = user.Company.priceCategory;
        }
      }
    } catch (e) {}

    if (priceCategory === "wholesale" && prod.wholesalePrice) {
      prod.displayPrice = prod.wholesalePrice;
    } else if (priceCategory === "vip" && prod.vipPrice) {
      prod.displayPrice = prod.vipPrice;
    } else if (priceCategory) {
      prod.displayPrice = prod.basePrice;
    } else {
      prod.displayPrice = null;
      prod.priceFrom = prod.basePrice;
    }

    res.status(200).json(prod);
  } catch (err) {
    next(err);
  }
});

// AI-powered smart product search
productsRouter.post("/ai-search", async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Введите описание товара" });
    }

    const { getDb } = require("../db/db");
    const allProducts = await getDb().models.Product.findAll({
      where: { isActive: true },
      include: "Category",
    });

    // Tokenize query: lowercase, split, remove short words
    const queryTokens = query
      .toLowerCase()
      .replace(/[^\wа-яёА-ЯЁ\s\d.-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    if (queryTokens.length === 0) {
      return res.status(200).json({ products: [], query });
    }

    // Score each product by keyword matches in name, description, specs, category
    const scored = allProducts.map((p) => {
      const prod = p.toJSON();
      const searchText = [
        prod.name || "",
        prod.description || "",
        prod.specs || "",
        prod.brand || "",
        prod.sku || "",
        prod.Category?.name || "",
        prod.Category?.description || "",
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      let matchedTokens = 0;

      for (const token of queryTokens) {
        const regex = new RegExp(token, "gi");
        const matches = searchText.match(regex);
        if (matches) {
          matchedTokens++;
          // More weight for name matches
          const nameMatches = (prod.name || "").toLowerCase().match(regex);
          score += matches.length + (nameMatches ? nameMatches.length * 3 : 0);
        }
      }

      // Bonus for matching more unique tokens
      const tokenCoverage = matchedTokens / queryTokens.length;
      score *= 1 + tokenCoverage;

      return { ...prod, _score: score, _coverage: tokenCoverage };
    });

    // Filter products with score > 0, sort by score desc, limit to 20
    const results = scored
      .filter((p) => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
      .map(({ _score, _coverage, ...prod }) => prod);

    res.status(200).json({ products: results, query, total: results.length });
  } catch (err) {
    next(err);
  }
});

module.exports = productsRouter;
