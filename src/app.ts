import express, { Application } from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import { config } from "./config";
import authRoutes from './routes/auth.routes';
import devRoutes from './routes/dev.routes';
import taskRoutes from './routes/task.routes';
import assignmentRoutes from './routes/assignment.route';
import categoryRoutes from './routes/category.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import subcategoryRoutes from './routes/subCategory.routes';
// import { startCronJobs } from './utils/awsCronJobs';

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
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OPS TASK MANAGER API!' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// for development purposes only
if (config.nodeEnv === 'development') {
  app.use('/api/dev', devRoutes);
}

// Global Error Handler
app.use(errorHandler);

// startCronJobs();

export default app;