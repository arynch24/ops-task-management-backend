import express, { Application } from "express";
import morgan from "morgan";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";

const app: Application = express();

app.use(cors({
    origin: config.clientUrl,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/users", userRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;