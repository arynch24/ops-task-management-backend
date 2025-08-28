import dotenv from "dotenv";

dotenv.config(); // Load .env file

// Centralized config with type safety
export const config = {
    port: process.env.PORT,
    clientUrl: process.env.CLIENT_URL,
    origin: process.env.ORIGIN,
    jwtSecret: process.env.JWT_SECRET,
    dbUrl: process.env.DB_URL
};
