const express = require('express');
const {getUserIdByToken} = require("../db/tokens");
const {getUserById} = require("../db/users");
const {getAllTopics, createTopic, getTopicById} = require("../db/topics");
const {checkAuth} = require("../models/user");
const {NotFoundError} = require("../errors");
const topicRouter = express.Router();

topicRouter.get("/", async (req, res, next) => {
    try {
        const token = req.cookies.token;
        await checkAuth(token);

        const topics = await getAllTopics();
        res.status(200).json(topics);
    } catch (err) {
        next(err);
    }
});

topicRouter.get("/:id", async (req, res, next) => {
    try {
        const token = req.cookies.token;
        await checkAuth(token);

        const topic = await getTopicById(req.params.id);

        if (!topic) {
            throw new NotFoundError("Топик не найден");
        }

        res.status(200).json(topic);
    } catch (err) {
        next(err);
    }
});

topicRouter.post("/", async (req, res, next) => {
    try {
        const token = req.cookies.token;
        const userId = await checkAuth(token);

        const newTopic = await createTopic(req.body.theme, userId);
        res.status(200).json(newTopic);
    } catch (err) {
        next(err);
    }
});

module.exports = topicRouter;