const {getDb} = require("./db");

const TABLE_NAME = "topics";

module.exports = {
    getAllTopics: async () => {
        return await getDb().models.Topic.findAll();
    },
    getTopicById: async (id) => {
        return await getDb().models.Topic.findByPk(id);
    },
    createTopic: async (theme, userId) => {
        const newTopic = await getDb().models.Topic.create({
            theme
        });
        const user = await getDb().models.User.findByPk(userId);
        await newTopic.setUser(user);
        return newTopic;
    },
}