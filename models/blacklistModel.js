const { Schema, model } = require("mongoose");

const blacklistSchema = new Schema({
  token: { type: String, required: true },
});

const blackListModel = model("tokenblacklist", blacklistSchema);

module.exports = blackListModel;