import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const DEFAULT_USERS = [
  {
    fullName: "ronaldo",
    email: "ronaldo@gmail.com",
    password: "admin@1234",
  },
  {
    fullName: "messi",
    email: "messi@gmail.com",
    password: "admin@1234",
  },
];

export const seedDefaultUsers = async () => {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      return;
    }

    const usersWithHashedPassword = await Promise.all(
      DEFAULT_USERS.map(async (user) => ({
        fullName: user.fullName,
        email: user.email.toLowerCase().trim(),
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    await User.insertMany(usersWithHashedPassword);
    console.log("Default development users seeded successfully");
  } catch (error) {
    console.error("Error seeding default users:", error);
  }
};
