const express = require("express");
const {
  getUserByLogin,
  getUserByEmail,
  addUser,
  getUserById,
  getUsersByCompany,
} = require("../db/users");
const { addCompany, getCompanyByInn } = require("../db/companies");
const { checkAuth } = require("../models/user");
const { BadRequestError } = require("../errors");
const userRouter = express.Router();

userRouter.get("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);
    const safeUser = {
      id: user.id,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      phone: user.phone,
      role: user.role,
      isSystemAdmin: user.isSystemAdmin,
      Company: user.Company,
    };
    res.status(200).json(safeUser);
  } catch (err) {
    next(err);
  }
});

userRouter.post("/", async (req, res, next) => {
  try {
    const { company, user, inviteToken } = req.body;

    const existingLogin = await getUserByLogin(user.login);
    if (existingLogin) {
      throw new BadRequestError("Пользователь с таким логином уже существует");
    }
    const existingEmail = await getUserByEmail(user.email);
    if (existingEmail) {
      throw new BadRequestError("Пользователь с таким email уже существует");
    }

    // Invite-based registration (employee joining existing company)
    if (inviteToken) {
      const { getDb } = require("../db/db");
      const invite = await getDb().models.Invite.findOne({ where: { token: inviteToken, status: "pending" } });
      if (!invite) throw new BadRequestError("Приглашение недействительно или уже использовано");

      const newUser = await addUser({
        login: user.login,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        patronymic: user.patronymic,
        phone: user.phone,
        role: invite.role || "buyer",
        companyId: invite.CompanyId,
      });

      invite.status = "accepted";
      await invite.save();

      return res.status(200).json({ ok: true, message: "Регистрация успешна! Вы добавлены в компанию." });
    }

    // Standard registration (new company)
    const existingInn = await getCompanyByInn(company.inn);
    if (existingInn) {
      throw new BadRequestError("Компания с таким ИНН уже зарегистрирована");
    }

    const newCompany = await addCompany({
      companyName: company.companyName,
      companyType: company.companyType,
      inn: company.inn,
      kpp: company.kpp,
      ogrn: company.ogrn,
      legalAddress: company.legalAddress,
      actualAddress: company.actualAddress,
      phone: company.phone,
      email: company.email,
      contactPerson: `${user.lastName} ${user.firstName} ${user.patronymic || ""}`.trim(),
      bankName: company.bankName,
      bik: company.bik,
      corrAccount: company.corrAccount,
      settlAccount: company.settlAccount,
    });

    const newUser = await addUser({
      login: user.login,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      phone: user.phone,
      role: "admin",
      companyId: newCompany.id,
    });

    res.status(200).json({ ok: true, message: "Регистрация успешна! Ожидайте модерацию." });
  } catch (err) {
    next(err);
  }
});

userRouter.get("/team", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const userId = await checkAuth(token);
    const user = await getUserById(userId);
    const team = await getUsersByCompany(user.CompanyId);
    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
});

module.exports = userRouter;