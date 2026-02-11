const { getDb } = require("./db");
const { Op } = require("sequelize");

module.exports = {
  getAllProducts: async (filters = {}) => {
    const where = {};
    if (!filters.includeInactive) where.isActive = true;
    if (filters.categoryId) where.CategoryId = filters.categoryId;
    if (filters.brand) where.brand = filters.brand;
    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { sku: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }
    if (filters.minPrice) where.basePrice = { ...where.basePrice, [Op.gte]: filters.minPrice };
    if (filters.maxPrice) where.basePrice = { ...where.basePrice, [Op.lte]: filters.maxPrice };

    const options = {
      where,
      include: "Category",
      order: [["createdAt", "DESC"]],
    };
    if (filters.limit) options.limit = parseInt(filters.limit);
    if (filters.offset) options.offset = parseInt(filters.offset);

    return await getDb().models.Product.findAndCountAll(options);
  },
  getProductById: async (id) =>
    await getDb().models.Product.findByPk(id, { include: "Category" }),
  getProductBySlug: async (slug) =>
    await getDb().models.Product.findOne({ where: { slug }, include: "Category" }),
  createProduct: async (data) => await getDb().models.Product.create(data),
  updateProduct: async (id, data) => {
    const product = await getDb().models.Product.findByPk(id);
    if (product) {
      Object.assign(product, data);
      await product.save();
    }
    return product;
  },
  deleteProduct: async (id) => {
    const product = await getDb().models.Product.findByPk(id);
    if (product) {
      product.isActive = false;
      await product.save();
    }
    return product;
  },
  getBrands: async () => {
    const products = await getDb().models.Product.findAll({
      attributes: ["brand"],
      where: { isActive: true, brand: { [Op.ne]: null } },
      group: ["brand"],
    });
    return products.map((p) => p.brand);
  },
};
