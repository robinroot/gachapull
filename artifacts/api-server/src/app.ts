import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { uploadsDir } from "./routes/upload";
import { apiLimiter } from "./middlewares/rate-limit";

const app: Express = express();

// Trust reverse proxy (Nginx) — needed for correct IP in rate limiting
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

// CORS — restrict to allowed origins in production
const rawOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        }
      : true,
    credentials: true,
  }),
);

// Request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Body size limits (prevent large payload attacks)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// General rate limit for all API routes
app.use("/api", apiLimiter);

// Static uploads
app.use("/api/uploads", express.static(uploadsDir));

// Main routes
app.use("/api", router);

export default app;
