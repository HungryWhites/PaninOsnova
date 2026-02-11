const { getDb } = require("./db");

module.exports = {
  addCompany: async (data) => {
    return await getDb().models.Company.create({
      companyName: data.companyName,
      companyType: data.companyType,
      inn: data.inn,
      kpp: data.kpp || null,
      ogrn: data.ogrn || null,
      legalAddress: data.legalAddress || null,
      actualAddress: data.actualAddress || null,
      phone: data.phone,
      email: data.email,
      contactPerson: data.contactPerson,
      status: "pending",
      priceCategory: "base",
    });
  },
  getCompanyById: async (id) => await getDb().models.Company.findByPk(id),
  getCompanyByInn: async (inn) =>
    await getDb().models.Company.findOne({ where: { inn } }),
  getAllCompanies: async () => await getDb().models.Company.findAll(),
  updateCompany: async (id, data) => {
    const company = await getDb().models.Company.findByPk(id);
    if (company) {
      Object.assign(company, data);
      await company.save();
    }
    return company;
  },
};
