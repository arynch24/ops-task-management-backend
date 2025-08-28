import express, { Application } from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import { config } from "./config";
import authRoutes from './routes/auth.routes';
import devRoutes from './routes/dev.routes';

const app: Application = express();

app.use(helmet());
app.use(cors({
    origin: config.clientUrl,
    credentials: true
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to OPS TASK MANAGER API!' });
});

// for development purposes only
if (config.nodeEnv === 'development') {
  app.use('/api/dev', devRoutes);
}

// Global Error Handler
app.use(errorHandler);

export default app;