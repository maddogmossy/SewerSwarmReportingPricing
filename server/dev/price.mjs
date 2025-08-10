import { Router } from "express";
import { priceItem } from "../pricing/adapter.ts"; // Node can import TS with tsx/esbuild build; if not, transpile or change to .js

const router = Router();

router.get("/api/dev/price", async (req, res) => {
  try {
    const kind = String(req.query.kind || "PATCH").toUpperCase();
    const lengthM = req.query.lengthM ? Number(req.query.lengthM) : undefined;
    const diameterMm = req.query.diameterMm ? Number(req.query.diameterMm) : undefined;
    const material = req.query.material ? String(req.query.material).toUpperCase() : undefined;
    const r = await priceItem({ kind, lengthM, diameterMm, material });
    res.json({ ok: true, input: { kind, lengthM, diameterMm, material }, result: r });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;