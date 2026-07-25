import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 2000;

export const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("<cluster>") || uri.includes("<username>")) {
    console.log("No valid MONGODB_URI found. Starting in-memory MongoDB for development...");
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log("In-memory MongoDB started successfully");
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * attempt;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.error(
    "\n========================================\n" +
    "  MONGODB CONNECTION FAILED\n" +
    "========================================\n" +
    "Could not connect after " + MAX_RETRIES + " attempts.\n\n" +
    "Check your MONGODB_URI environment variable:\n" +
    "  1. Go to MongoDB Atlas → Database → your cluster\n" +
    "  2. Make sure the cluster is ACTIVE (free-tier clusters\n" +
    "     pause after 60 days of inactivity — click Resume)\n" +
    "  3. Click Connect → Drivers → copy the connection string\n" +
    "  4. Replace <username> and <password> with your DB user creds\n" +
    "  5. Under Network Access, ensure 0.0.0.0/0 is allowed\n" +
    "  6. Paste the corrected URI into Render → Environment\n" +
    "========================================\n"
  );
  process.exit(1);
};
