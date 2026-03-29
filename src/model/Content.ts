import mongoose = require("mongoose");

const Content = new mongoose.Schema({
    link: String,
    type: {
        type: String,
        enum: ["tweet", "video", "document", "link", "tag"],
        required: true
    },
    title: String,
    tags: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})
export const ContentModel = mongoose.model("Content",Content); 
