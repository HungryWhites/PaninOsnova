const { getDb } = require("./db");

module.exports = {
  getAllCategories: async () =>
    await getDb().models.Category.findAll({ order: [["sortOrder", "ASC"]] }),
  getCategoryById: async (id) => await getDb().models.Category.findByPk(id),
  getCategoryBySlug: async (slug) =>
    await getDb().models.Category.findOne({ where: { slug } }),
  createCategory: async (data) => await getDb().models.Category.create(data),
  updateCategory: async (id, data) => {
    const cat = await getDb().models.Category.findByPk(id);
    if (cat) {
      Object.assign(cat, data);
      await cat.save();
    }
    return cat;
  },
  deleteCategory: async (id) => {
    await getDb().models.Category.destroy({ where: { id } });
  },
};
