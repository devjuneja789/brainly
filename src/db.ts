// db.ts
import mongoose = require("mongoose");

async function connectDB() {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("Connected to DB");
}

export default connectDB;