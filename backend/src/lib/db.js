import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // If no valid MONGODB_URI is set, use in-memory MongoDB for development
    if (!uri || uri.includes("<cluster>") || uri.includes("<username>")) {
      console.log("No valid MONGODB_URI found. Starting in-memory MongoDB for development...");
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log("In-memory MongoDB started successfully");
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
