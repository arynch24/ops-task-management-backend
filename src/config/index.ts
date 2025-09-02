import dotenv from "dotenv";

dotenv.config(); // Load .env file

// Centralized config with type safety
export const config = {
    port: process.env.PORT,
    clientUrl: process.env.ORIGIN,
    jwtSecret: process.env.JWT_SECRET,
    dbUrl: process.env.DB_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    nodeEnv: process.env.NODE_ENV,
};
