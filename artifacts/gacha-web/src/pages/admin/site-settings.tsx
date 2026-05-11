import { useState } from "react";
import { useTitle } from "@/lib/helpers";
import { useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Globe, ImageIcon, Search, Share2, ExternalLink } from "lucide-react";

type SiteForm = {
  siteName: string;
  siteTagline: string;
  faviconUrl: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
};

export default function AdminSiteSettings() {
  useTitle("Admin - Site Settings");
  const { settings, refetch } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState<SiteForm>({
    siteName: "",
    siteTagline: "",
    faviconUrl: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
  });

  if (settings.siteName && !initialized) {
    setForm({
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      faviconUrl: settings.faviconUrl,
      metaDescription: settings.metaDescription,
      metaKeywords: settings.metaKeywords,
      ogTitle: settings.ogTitle,
      ogDescription: settings.ogDescription,
      ogImageUrl: settings.ogImageUrl,
    });
    setInitialized(true);
  }

  const setField = (field: keyof SiteForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.siteName.trim()) {
      toast.error("Nama situs tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("gacha_token");
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Site settings berhasil disimpan!");
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Site Settings</h1>
        <p className="text-muted-foreground mt-1">Atur nama situs, favicon, dan meta tag untuk SEO.</p>
      </div>

      {/* General */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" /> Identitas Situs
          </CardTitle>
          <CardDescription>Nama dan tagline yang muncul di navbar dan tab browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="siteName">Nama Situs</Label>
            <Input
              id="siteName"
              placeholder="GachaPull"
              value={form.siteName}
              onChange={e => setField("siteName", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Muncul di navbar, title browser, dan footer.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siteTagline">Tagline</Label>
            <Input
              id="siteTagline"
              placeholder="Pokemon & One Piece"
              value={form.siteTagline}
              onChange={e => setField("siteTagline", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Sub-judul singkat di bawah nama situs.</p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5 text-primary" /> Favicon
          </CardTitle>
          <CardDescription>Ikon kecil yang muncul di tab browser. Masukkan URL gambar (PNG/ICO/SVG, disarankan 32×32).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="faviconUrl">URL Favicon</Label>
            <div className="flex gap-2">
              <Input
                id="faviconUrl"
                placeholder="https://example.com/favicon.ico"
                value={form.faviconUrl}
                onChange={e => setField("faviconUrl", e.target.value)}
                className="flex-1"
              />
              {form.faviconUrl && (
                <a href={form.faviconUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" type="button">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
          {form.faviconUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
              <img
                src={form.faviconUrl}
                alt="favicon preview"
                className="w-8 h-8 object-contain rounded"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-xs text-muted-foreground">Preview favicon</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Meta */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5 text-primary" /> SEO — Meta Tags
          </CardTitle>
          <CardDescription>Informasi yang dibaca oleh Google dan mesin pencari lainnya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              placeholder="Situs gacha kartu terbaik dengan koleksi Pokemon dan One Piece..."
              value={form.metaDescription}
              onChange={e => setField("metaDescription", e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {form.metaDescription.length}/160 karakter — idealnya di bawah 160 karakter.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              placeholder="gacha, pokemon, one piece, kartu, koleksi"
              value={form.metaKeywords}
              onChange={e => setField("metaKeywords", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Pisahkan dengan koma.</p>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="w-5 h-5 text-primary" /> Open Graph (Media Sosial)
          </CardTitle>
          <CardDescription>Tampilan saat link dibagikan di WhatsApp, Twitter, Facebook, dll. Jika dikosongkan, akan menggunakan nama situs & meta description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ogTitle">OG Title</Label>
            <Input
              id="ogTitle"
              placeholder={form.siteName || "GachaPull"}
              value={form.ogTitle}
              onChange={e => setField("ogTitle", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ogDescription">OG Description</Label>
            <Textarea
              id="ogDescription"
              placeholder={form.metaDescription || "Deskripsi singkat untuk media sosial..."}
              value={form.ogDescription}
              onChange={e => setField("ogDescription", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ogImageUrl">OG Image URL</Label>
            <Input
              id="ogImageUrl"
              placeholder="https://example.com/og-image.jpg"
              value={form.ogImageUrl}
              onChange={e => setField("ogImageUrl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Disarankan ukuran 1200×630 piksel.</p>
          </div>
          {form.ogImageUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={form.ogImageUrl}
                alt="OG preview"
                className="w-full h-40 object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="p-3 bg-secondary/30">
                <p className="text-xs font-bold truncate">{form.ogTitle || form.siteName}</p>
                <p className="text-xs text-muted-foreground truncate">{form.ogDescription || form.metaDescription}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving ? "Menyimpan..." : "Simpan Settings"}
        </Button>
      </div>
    </div>
  );
}
