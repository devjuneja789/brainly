import mongoose = require("mongoose");

const Tag = new mongoose.Schema({
        title: String
})

const TagModel = mongoose.model("Tag",Tag);  

module.exports = {
    TagModel
}    