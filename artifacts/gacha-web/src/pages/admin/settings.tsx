import { useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, Key, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

type DuitkuSettings = {
  merchantCode: string;
  apiKey: string;
  isProduction: boolean;
  enabled: boolean;
};

type SettingsData = {
  duitku: DuitkuSettings;
};

export default function AdminSettings() {
  useTitle("Admin - Settings");
  const { data, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState<DuitkuSettings>({
    merchantCode: "",
    apiKey: "",
    isProduction: false,
    enabled: false,
  });
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    const d = data as unknown as SettingsData;
    setForm({
      merchantCode: d.duitku?.merchantCode || "",
      apiKey: d.duitku?.apiKey === "***" ? "" : d.duitku?.apiKey || "",
      isProduction: d.duitku?.isProduction || false,
      enabled: d.duitku?.enabled || false,
    });
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({ data: { duitku: form } as Record<string, unknown> });
      toast.success("Settings Duitku disimpan!");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold mb-6">Settings</h1>
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  const isConfigured = !!(form.merchantCode && form.apiKey && form.apiKey !== "***");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi payment gateway Duitku</p>
      </div>

      <Card className="bg-card border-border max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Duitku Payment Gateway
              {isConfigured && form.enabled ? (
                <Badge className="bg-green-600 text-white text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  <AlertCircle className="w-3 h-3 mr-1" /> Demo Mode
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Aktif</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            </div>
          </div>
          <CardDescription>
            QRIS, GoPay, OVO, DANA, ShopeePay, Virtual Account — powered by Duitku
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Info box */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 space-y-1">
            <p className="font-semibold">Cara mendapatkan credentials Duitku:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-300">
              <li>Daftar di <a href="https://sandbox.duitku.com" target="_blank" rel="noopener noreferrer" className="underline">sandbox.duitku.com</a> untuk mode demo</li>
              <li>Masuk ke menu <strong>Project</strong> → pilih/buat project</li>
              <li>Salin <strong>Merchant Code</strong> dan <strong>API Key</strong></li>
              <li>Set Callback URL ke: <code className="bg-blue-900/30 px-1 rounded">https://domain-kamu.com/api/wallet/duitku/callback</code></li>
            </ol>
            <a
              href="https://docs.duitku.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mt-1"
            >
              <ExternalLink className="w-3 h-3" /> Dokumentasi Duitku
            </a>
          </div>

          <div className="space-y-2">
            <Label>Merchant Code</Label>
            <Input
              value={form.merchantCode}
              onChange={(e) => setForm((f) => ({ ...f, merchantCode: e.target.value }))}
              placeholder="DS12345"
            />
            <p className="text-xs text-muted-foreground">Contoh: DS12345 (dari halaman Project di dashboard Duitku)</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> API Key</Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="API Key dari dashboard Duitku"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSecret(v => !v)}
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Switch
              checked={form.isProduction}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isProduction: v }))}
            />
            <div>
              <Label className="cursor-pointer">Mode Produksi</Label>
              <p className="text-xs text-muted-foreground">
                {form.isProduction
                  ? "Menggunakan API produksi Duitku (transaksi nyata)"
                  : "Menggunakan API sandbox Duitku (transaksi uji coba)"}
              </p>
            </div>
          </div>

          {!isConfigured && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
              Merchant Code dan API Key belum diisi — sistem akan berjalan dalam <strong>Demo Mode</strong> (top-up disimulasikan tanpa pembayaran nyata).
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Simpan Settings Duitku
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
