import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import sequelize from "./config/database";

const app = express();

// Security middleware
// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy for accurate IP addresses
app.set("trust proxy", true);

// Routes
app.use("/", routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and sync
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync database models
    await sequelize.sync({
      force:
        process.env.NODE_ENV === "development" &&
        process.env.DB_FORCE_SYNC === "true",
    });
    console.log("Database models synchronized successfully.");

    // Auto-seed in development if no data exists
    if (
      process.env.NODE_ENV === "development" &&
      process.env.AUTO_SEED === "true"
    ) {
      const { DatabaseSeeder } = await import("./seeders");
      const { Organization } = await import("./models");

      const orgCount = await Organization.count();
      if (orgCount === 0) {
        console.log("🌱 No data found, running auto-seed...");
        const seeder = new DatabaseSeeder(sequelize);
        await seeder.run();
      }
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

export default app;
