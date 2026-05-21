import mongoose = require("mongoose");



const Content = new mongoose.Schema({
    link: String,
    body: String,
    contentType: {
        type: String,
        enum: ["twitter", "youtube", "note", "link"],
        required: true
    },
    title: String,
    tags: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true })
export const ContentModel = mongoose.model("Content", Content); 
