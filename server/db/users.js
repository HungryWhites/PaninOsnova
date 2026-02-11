const { getDb } = require("./db");
const md5 = require("md5");

module.exports = {
  addUser: async (data) => {
    return await getDb().models.User.create({
      login: data.login,
      email: data.email,
      password: md5(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      patronymic: data.patronymic || null,
      phone: data.phone,
      role: data.role || "admin",
      isSystemAdmin: data.isSystemAdmin || false,
      CompanyId: data.companyId || null,
    });
  },
  getUsers: async () => await getDb().models.User.findAll({ include: "Company" }),
  getUserByLogin: async (login) =>
    await getDb().models.User.findOne({ where: { login }, include: "Company" }),
  getUserByEmail: async (email) =>
    await getDb().models.User.findOne({ where: { email }, include: "Company" }),
  getUserById: async (id) =>
    await getDb().models.User.findByPk(id, { include: "Company" }),
  getUsersByCompany: async (companyId) =>
    await getDb().models.User.findAll({ where: { CompanyId: companyId } }),
  updateUser: async (id, data) => {
    const user = await getDb().models.User.findByPk(id);
    if (user) {
      Object.assign(user, data);
      await user.save();
    }
    return user;
  },
};