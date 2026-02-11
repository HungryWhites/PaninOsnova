const express = require("express");
const categoriesRouter = express.Router();
const { getAllCategories, getCategoryById, getCategoryBySlug } = require("../db/categories");

categoriesRouter.get("/", async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    let category;
    if (isNaN(id)) {
      category = await getCategoryBySlug(id);
    } else {
      category = await getCategoryById(id);
    }
    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
});

module.exports = categoriesRouter;
