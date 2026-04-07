import mongoose = require("mongoose");



const Content = new mongoose.Schema({
    link: String,
    contentType: {        
        type: String,
        enum: ["twitter" , "youtube"],
        required: true
    },
    title: String,
    tags: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})
export const ContentModel = mongoose.model("Content", Content); 
