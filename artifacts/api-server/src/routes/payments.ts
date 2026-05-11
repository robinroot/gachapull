import { Router } from "express";

const router = Router();

router.all("/payments/stripe/create-session", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/stripe/webhook", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/midtrans/create", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/midtrans/webhook", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/usdt/create", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/packages", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});
router.all("/payments/history", (_req, res) => {
  res.status(410).json({ error: "Legacy payment endpoint removed." });
});

export default router;
