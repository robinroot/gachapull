import { useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CreditCard, Key, Eye, EyeOff } from "lucide-react";

type MidtransSettings = {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  enabled: boolean;
};

type SettingsData = {
  midtrans: MidtransSettings;
};

export default function AdminSettings() {
  useTitle("Admin - Settings");
  const { data, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState<MidtransSettings>({
    serverKey: "",
    clientKey: "",
    isProduction: false,
    enabled: false,
  });
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    const d = data as unknown as SettingsData;
    setForm({
      serverKey: d.midtrans?.serverKey === "***" ? "" : d.midtrans?.serverKey || "",
      clientKey: d.midtrans?.clientKey || "",
      isProduction: d.midtrans?.isProduction || false,
      enabled: d.midtrans?.enabled || false,
    });
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({ data: { midtrans: form } as Record<string, unknown> });
      toast.success("Settings disimpan!");
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi payment gateway Midtrans</p>
      </div>

      <Card className="bg-card border-border max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Midtrans
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Aktif</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            </div>
          </div>
          <CardDescription>QRIS, GoPay, OVO, DANA payment gateway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Server Key</Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={form.serverKey}
                onChange={(e) => setForm((f) => ({ ...f, serverKey: e.target.value }))}
                placeholder="Mid-server-..."
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowSecret(v => !v)}>
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Client Key</Label>
            <Input
              value={form.clientKey}
              onChange={(e) => setForm((f) => ({ ...f, clientKey: e.target.value }))}
              placeholder="Mid-client-..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isProduction} onCheckedChange={(v) => setForm((f) => ({ ...f, isProduction: v }))} />
            <Label>Mode Produksi</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Simpan Settings Midtrans
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
