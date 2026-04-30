import { useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CreditCard, Bitcoin, Key, Eye, EyeOff, Settings } from "lucide-react";

type SettingsData = {
  stripe: { publicKey: string; secretKey: string; webhookSecret: string; enabled: boolean };
  midtrans: { serverKey: string; clientKey: string; isProduction: boolean; enabled: boolean };
  usdt: { walletAddress: string; network: string; enabled: boolean };
  nowpayments: { apiKey: string; enabled: boolean };
};

export default function AdminSettings() {
  useTitle("Admin - Settings");
  const { data, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<SettingsData>({
    stripe: { publicKey: "", secretKey: "", webhookSecret: "", enabled: false },
    midtrans: { serverKey: "", clientKey: "", isProduction: false, enabled: false },
    usdt: { walletAddress: "", network: "TRC20", enabled: false },
    nowpayments: { apiKey: "", enabled: false },
  });
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    const d = data as unknown as SettingsData;
    setForm({
      stripe: {
        publicKey: d.stripe?.publicKey || "",
        secretKey: d.stripe?.secretKey === "***" ? "" : d.stripe?.secretKey || "",
        webhookSecret: d.stripe?.webhookSecret === "***" ? "" : d.stripe?.webhookSecret || "",
        enabled: d.stripe?.enabled || false,
      },
      midtrans: {
        serverKey: d.midtrans?.serverKey === "***" ? "" : d.midtrans?.serverKey || "",
        clientKey: d.midtrans?.clientKey || "",
        isProduction: d.midtrans?.isProduction || false,
        enabled: d.midtrans?.enabled || false,
      },
      usdt: {
        walletAddress: d.usdt?.walletAddress || "",
        network: d.usdt?.network || "TRC20",
        enabled: d.usdt?.enabled || false,
      },
      nowpayments: {
        apiKey: d.nowpayments?.apiKey === "***" ? "" : d.nowpayments?.apiKey || "",
        enabled: d.nowpayments?.enabled || false,
      },
    });
    setInitialized(true);
  }

  const handleSave = async (section: keyof SettingsData) => {
    setSaving(section);
    try {
      await updateSettings.mutateAsync({ data: { [section]: form[section] } as Record<string, unknown> });
      toast.success("Settings saved!");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const toggle = (key: string) => setShowSecrets((p) => ({ ...p, [key]: !p[key] }));

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-display font-bold mb-6">Settings</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure payment gateways and platform settings</p>
      </div>

      <div className="space-y-6">
        {/* Stripe */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Stripe</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Enabled</Label>
                <Switch checked={form.stripe.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, stripe: { ...f.stripe, enabled: v } }))} />
              </div>
            </div>
            <CardDescription>Card payments via Stripe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Publishable Key</Label>
              <Input value={form.stripe.publicKey} onChange={(e) => setForm((f) => ({ ...f, stripe: { ...f.stripe, publicKey: e.target.value } }))} placeholder="pk_live_..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Secret Key</Label>
              <div className="relative">
                <Input type={showSecrets.stripe_secret ? "text" : "password"} value={form.stripe.secretKey} onChange={(e) => setForm((f) => ({ ...f, stripe: { ...f.stripe, secretKey: e.target.value } }))} placeholder="sk_live_..." className="pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggle("stripe_secret")}>
                  {showSecrets.stripe_secret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Webhook Secret</Label>
              <div className="relative">
                <Input type={showSecrets.stripe_webhook ? "text" : "password"} value={form.stripe.webhookSecret} onChange={(e) => setForm((f) => ({ ...f, stripe: { ...f.stripe, webhookSecret: e.target.value } }))} placeholder="whsec_..." className="pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggle("stripe_webhook")}>
                  {showSecrets.stripe_webhook ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => handleSave("stripe")} disabled={saving === "stripe"} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {saving === "stripe" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Stripe Settings
            </Button>
          </CardContent>
        </Card>

        {/* Midtrans */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Midtrans</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Enabled</Label>
                <Switch checked={form.midtrans.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, midtrans: { ...f.midtrans, enabled: v } }))} />
              </div>
            </div>
            <CardDescription>Indonesian payment gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Server Key</Label>
              <div className="relative">
                <Input type={showSecrets.midtrans_server ? "text" : "password"} value={form.midtrans.serverKey} onChange={(e) => setForm((f) => ({ ...f, midtrans: { ...f.midtrans, serverKey: e.target.value } }))} placeholder="Mid-server-..." className="pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggle("midtrans_server")}>
                  {showSecrets.midtrans_server ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client Key</Label>
              <Input value={form.midtrans.clientKey} onChange={(e) => setForm((f) => ({ ...f, midtrans: { ...f.midtrans, clientKey: e.target.value } }))} placeholder="Mid-client-..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.midtrans.isProduction} onCheckedChange={(v) => setForm((f) => ({ ...f, midtrans: { ...f.midtrans, isProduction: v } }))} />
              <Label>Production Mode</Label>
            </div>
            <Button onClick={() => handleSave("midtrans")} disabled={saving === "midtrans"} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {saving === "midtrans" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Midtrans Settings
            </Button>
          </CardContent>
        </Card>

        {/* USDT */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bitcoin className="w-5 h-5 text-primary" /> USDT</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Enabled</Label>
                <Switch checked={form.usdt.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, usdt: { ...f.usdt, enabled: v } }))} />
              </div>
            </div>
            <CardDescription>Crypto payments via USDT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input value={form.usdt.walletAddress} onChange={(e) => setForm((f) => ({ ...f, usdt: { ...f.usdt, walletAddress: e.target.value } }))} placeholder="T... or 0x..." />
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <Input value={form.usdt.network} onChange={(e) => setForm((f) => ({ ...f, usdt: { ...f.usdt, network: e.target.value } }))} placeholder="TRC20" />
            </div>
            <Button onClick={() => handleSave("usdt")} disabled={saving === "usdt"} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {saving === "usdt" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save USDT Settings
            </Button>
          </CardContent>
        </Card>

        {/* NowPayments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> NowPayments</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Enabled</Label>
                <Switch checked={form.nowpayments.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, nowpayments: { ...f.nowpayments, enabled: v } }))} />
              </div>
            </div>
            <CardDescription>Crypto payment gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> API Key</Label>
              <div className="relative">
                <Input type={showSecrets.nowpayments ? "text" : "password"} value={form.nowpayments.apiKey} onChange={(e) => setForm((f) => ({ ...f, nowpayments: { ...f.nowpayments, apiKey: e.target.value } }))} placeholder="API key..." className="pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => toggle("nowpayments")}>
                  {showSecrets.nowpayments ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => handleSave("nowpayments")} disabled={saving === "nowpayments"} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {saving === "nowpayments" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save NowPayments Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
