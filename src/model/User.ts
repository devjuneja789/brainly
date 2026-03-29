import mongoose = require("mongoose");

const User = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});


export const UsersModel = mongoose.model("User",User);
