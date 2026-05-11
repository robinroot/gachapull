import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  keyGenerator: (req) => req.ip ?? "unknown",
});

export const topupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan top-up. Coba lagi dalam 1 menit." },
  keyGenerator: (req) => String(req.user?.userId ?? req.ip ?? "unknown"),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak request. Coba lagi sebentar lagi." },
  keyGenerator: (req) => req.ip ?? "unknown",
});
