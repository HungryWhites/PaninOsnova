const express = require("express");
const md5 = require("md5");
const authRouter = express.Router();
const { getUserByLogin, getUserByEmail } = require("../db/users");
const { addToken, deleteByToken } = require("../db/tokens");
const { NotFoundError, BadRequestError } = require("../errors");
const { checkAuth } = require("../models/user");

const COOKIE_NAME = "token";

authRouter.post("/", async (req, res, next) => {
  try {
    const loginField = req.body.login;
    let user = await getUserByLogin(loginField);
    if (!user) {
      user = await getUserByEmail(loginField);
    }
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    if (user.Company && user.Company.status !== "approved") {
      throw new BadRequestError("Ваша компания ещё не прошла модерацию");
    }
    if (user.password !== md5(req.body.password)) {
      throw new BadRequestError("Неверный пароль");
    }
    const token = await addToken(user.id);
    res.cookie(COOKIE_NAME, token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.delete("/", async (req, res, next) => {
  try {
    const token = req.cookies.token;
    await checkAuth(token);
    await deleteByToken(token);
    res.clearCookie(COOKIE_NAME);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = authRouter;