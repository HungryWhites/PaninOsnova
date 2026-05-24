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

// AI-powered product recommendations
productsRouter.get("/ai-recommendations", async (req, res, next) => {
  try {
    const { getDb } = require("../db/db");
    const allProducts = await getDb().models.Product.findAll({
      where: { isActive: true },
      include: "Category",
    });

    if (allProducts.length === 0) {
      return res.status(200).json({ products: [], engine: "none" });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (DEEPSEEK_API_KEY) {
      try {
        const catalogLines = allProducts.map((p) => {
          const prod = p.toJSON();
          return `[ID:${prod.id}] ${prod.name} | ${prod.Category?.name || "—"} | ${prod.basePrice}р`;
        });

        const systemPrompt = `Ты — AI-ассистент B2B платформы ТД ПРОМСТРОЙ (вентиляционное оборудование).
Выбери 8 самых интересных и популярных товаров из каталога для рекомендации на главной странице.
Учитывай разнообразие категорий — выбирай из разных категорий.
Предпочитай востребованные товары: вентиляторы, клапаны, решётки, шумоглушители.

КАТАЛОГ:
${catalogLines.join("\n")}

Верни ТОЛЬКО JSON массив ID, например [1, 5, 12, 3, 8, 15, 22, 7]
Ровно 8 товаров. Без пояснений.`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "Порекомендуй 8 популярных товаров для главной страницы" },
            ],
            temperature: 0.3,
            max_tokens: 100,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "[]";
          const idMatch = content.match(/\[[\d,\s]*\]/);
          if (idMatch) {
            const ids = JSON.parse(idMatch[0]);
            const productsMap = {};
            allProducts.forEach((p) => { productsMap[p.id] = p.toJSON(); });
            const results = ids.filter((id) => productsMap[id]).map((id) => productsMap[id]);
            if (results.length >= 4) {
              return res.status(200).json({ products: results, engine: "deepseek" });
            }
          }
        }
      } catch (aiErr) {
        console.log("DeepSeek recommendations error:", aiErr.message);
      }
    }

    // Fallback: random 8 products from different categories
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    const seen = new Set();
    const diverse = [];
    for (const p of shuffled) {
      const catId = p.CategoryId;
      if (!seen.has(catId) || diverse.length >= allProducts.length) {
        diverse.push(p.toJSON());
        seen.add(catId);
      }
      if (diverse.length >= 8) break;
    }
    if (diverse.length < 8) {
      for (const p of shuffled) {
        if (!diverse.find((d) => d.id === p.id)) {
          diverse.push(p.toJSON());
          if (diverse.length >= 8) break;
        }
      }
    }
    res.status(200).json({ products: diverse, engine: "random" });
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

// Keyword-based fallback search
function keywordSearch(allProducts, query) {
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s\d.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (queryTokens.length === 0) return [];

  const scored = allProducts.map((p) => {
    const prod = p.toJSON ? p.toJSON() : p;
    const searchText = [
      prod.name || "", prod.description || "", prod.specs || "",
      prod.brand || "", prod.sku || "",
      prod.Category?.name || "", prod.Category?.description || "",
    ].join(" ").toLowerCase();

    let score = 0;
    let matchedTokens = 0;
    for (const token of queryTokens) {
      const regex = new RegExp(token, "gi");
      const matches = searchText.match(regex);
      if (matches) {
        matchedTokens++;
        const nameMatches = (prod.name || "").toLowerCase().match(regex);
        score += matches.length + (nameMatches ? nameMatches.length * 3 : 0);
      }
    }
    const tokenCoverage = matchedTokens / queryTokens.length;
    score *= 1 + tokenCoverage;
    return { ...prod, _score: score };
  });

  return scored
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 20)
    .map(({ _score, ...prod }) => prod);
}

// AI-powered smart product search (DeepSeek API or fallback)
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

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    // If DeepSeek API key is configured, use it
    if (DEEPSEEK_API_KEY) {
      try {
        // Build compact catalog for context
        const catalogLines = allProducts.map((p) => {
          const prod = p.toJSON();
          return `[ID:${prod.id}] ${prod.name} | Кат: ${prod.Category?.name || "—"} | Арт: ${prod.sku} | Цена: ${prod.basePrice}р | ${prod.description || ""}`;
        });
        const catalogText = catalogLines.join("\n");

        const systemPrompt = `Ты — AI-ассистент B2B платформы ТД ПРОМСТРОЙ, специализирующейся на вентиляционном и промышленном оборудовании.
У тебя есть каталог товаров. Пользователь описывает, что ему нужно. Ты должен найти подходящие товары ТОЛЬКО из каталога ниже.

КАТАЛОГ:
${catalogText}

ПРАВИЛА:
- Возвращай ТОЛЬКО ID товаров из каталога, которые подходят под запрос
- Формат ответа: JSON массив ID, например [1, 5, 12, 3]
- Если ничего не подходит, верни []
- Максимум 15 товаров
- Сортируй по релевантности (самые подходящие первыми)
- Учитывай название, категорию, описание, характеристики товара
- НЕ выдумывай товары, которых нет в каталоге`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: 0.1,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "[]";
          // Parse IDs from response
          const idMatch = content.match(/\[[\d,\s]*\]/);
          if (idMatch) {
            const ids = JSON.parse(idMatch[0]);
            const productsMap = {};
            allProducts.forEach((p) => { productsMap[p.id] = p.toJSON(); });
            const results = ids
              .filter((id) => productsMap[id])
              .map((id) => productsMap[id]);

            return res.status(200).json({
              products: results,
              query,
              total: results.length,
              engine: "deepseek",
            });
          }
        }
        // If DeepSeek fails, fall through to keyword search
      } catch (aiErr) {
        console.log("DeepSeek API error, falling back to keyword search:", aiErr.message);
      }
    }

    // Fallback: keyword-based search
    const results = keywordSearch(allProducts, query);
    res.status(200).json({ products: results, query, total: results.length, engine: "keyword" });
  } catch (err) {
    next(err);
  }
});

module.exports = productsRouter;
