import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";

const router = Router();

const SITE_DEFAULTS: Record<string, string> = {
  site_name: "GachaPull",
  site_tagline: "Pokemon & One Piece",
  favicon_url: "",
  meta_description: "",
  meta_keywords: "",
  og_title: "",
  og_description: "",
  og_image_url: "",
};

function buildSiteSettingsResponse(map: Record<string, string>) {
  return {
    siteName: map["site_name"] || SITE_DEFAULTS["site_name"],
    siteTagline: map["site_tagline"] || SITE_DEFAULTS["site_tagline"],
    faviconUrl: map["favicon_url"] || "",
    metaDescription: map["meta_description"] || "",
    metaKeywords: map["meta_keywords"] || "",
    ogTitle: map["og_title"] || "",
    ogDescription: map["og_description"] || "",
    ogImageUrl: map["og_image_url"] || "",
  };
}

export { buildSiteSettingsResponse };

router.get("/site-settings", async (req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const map: Record<string, string> = {};
    for (const s of rows) map[s.key] = s.value;
    res.json(buildSiteSettingsResponse(map));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

export default router;
