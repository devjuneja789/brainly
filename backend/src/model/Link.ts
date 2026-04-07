import mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
  }
);




export const LinkModel = mongoose.model("Link", linkSchema);

