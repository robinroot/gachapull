import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, TrendingUp, History, CheckCircle2, Loader2, Smartphone, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const TOPUP_PACKAGES = [
  { id: 1, name: "Starter", amountIdr: 10000 },
  { id: 2, name: "Basic", amountIdr: 25000 },
  { id: 3, name: "Value", amountIdr: 50000, isPopular: true },
  { id: 4, name: "Pro", amountIdr: 100000 },
  { id: 5, name: "Elite", amountIdr: 200000 },
  { id: 6, name: "Legendary", amountIdr: 500000 },
];

const PAYMENT_METHODS = [
  { id: "qris", label: "QRIS", icon: QrCode, desc: "Scan QR untuk bayar" },
  { id: "gopay", label: "GoPay", icon: Smartphone, desc: "Bayar via GoPay" },
  { id: "ovo", label: "OVO", icon: Smartphone, desc: "Bayar via OVO" },
  { id: "dana", label: "DANA", icon: Smartphone, desc: "Bayar via DANA" },
];

type Transaction = {
  id: number;
  amountIdr: number;
  type: string;
  description: string;
  createdAt: string;
};

type WalletData = {
  balanceIdr: number;
  totalTopup: number;
  totalSpent: number;
};

export default function WalletPage() {
  useTitle("Saldo & Top-up");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("qris");
  const [topupStep, setTopupStep] = useState<"select" | "confirm" | "paying" | "done">("select");
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    fetchWallet();
    fetchTransactions();
  }, [isAuthenticated]);

  const getToken = () => localStorage.getItem("gacha_token") || "";

  async function fetchWallet() {
    setIsLoadingWallet(true);
    try {
      const res = await fetch("/api/wallet", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setWallet(await res.json());
    } finally {
      setIsLoadingWallet(false);
    }
  }

  async function fetchTransactions() {
    setIsLoadingTx(true);
    try {
      const res = await fetch("/api/wallet/transactions?limit=10", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } finally {
      setIsLoadingTx(false);
    }
  }

  const selectedPkg = TOPUP_PACKAGES.find(p => p.id === selectedPackage);

  async function handleStartTopup() {
    if (!selectedPkg) { toast.error("Pilih nominal top-up dulu"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amountIdr: selectedPkg.amountIdr, method: selectedMethod }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal membuat order"); return; }
      setPendingOrderId(data.orderId);
      setTopupStep("paying");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmPayment() {
    if (!pendingOrderId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wallet/topup/${pendingOrderId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal konfirmasi"); return; }
      toast.success(data.message || "Top-up berhasil!");
      setTopupStep("done");
      await fetchWallet();
      await fetchTransactions();
      queryClient.invalidateQueries();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setTopupStep("select");
    setSelectedPackage(null);
    setPendingOrderId(null);
  }

  const txTypeLabel: Record<string, { label: string; color: string }> = {
    topup: { label: "Top-up", color: "text-green-500" },
    gacha_pull: { label: "Pull", color: "text-red-400" },
    buyback: { label: "Buyback", color: "text-blue-400" },
    refund: { label: "Refund", color: "text-green-400" },
    adjustment: { label: "Adjustment", color: "text-yellow-400" },
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold">Saldo & Top-up</h1>
          <p className="text-muted-foreground mt-1">Kelola saldo dan isi ulang untuk pull kartu</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {isLoadingWallet ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />)
          ) : (
            <>
              <Card className="bg-card border-primary/30 shadow-[0_0_20px_hsla(43,96%,58%,0.1)]">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    Saldo Saat Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-display font-bold text-primary">{formatIdr(wallet?.balanceIdr || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Total Top-up
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-display font-bold">{formatIdr(wallet?.totalTopup || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-display font-bold">{formatIdr(wallet?.totalSpent || 0)}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* TOP-UP PANEL */}
          <div>
            <h2 className="text-xl font-display font-bold mb-4">Top-up Saldo</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                {topupStep === "select" && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium mb-3 text-muted-foreground">Pilih nominal</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TOPUP_PACKAGES.map(pkg => (
                          <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={cn(
                              "relative p-3 rounded-xl border-2 text-left transition-all duration-200",
                              selectedPackage === pkg.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {(pkg as any).isPopular && (
                              <Badge className="absolute -top-2 -right-2 text-[9px] px-1.5 bg-primary text-primary-foreground">
                                Populer
                              </Badge>
                            )}
                            <p className="font-bold text-sm">{pkg.name}</p>
                            <p className="text-primary font-mono font-bold text-sm">{formatIdr(pkg.amountIdr)}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-3 text-muted-foreground">Metode pembayaran</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map(method => {
                          const Icon = method.icon;
                          return (
                            <button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className={cn(
                                "p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2",
                                selectedMethod === method.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <Icon className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <p className="font-bold text-sm">{method.label}</p>
                                <p className="text-xs text-muted-foreground">{method.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                      disabled={!selectedPackage}
                      onClick={() => setTopupStep("confirm")}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                )}

                {topupStep === "confirm" && selectedPkg && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nominal</span>
                        <span className="font-bold">{formatIdr(selectedPkg.amountIdr)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Metode</span>
                        <span className="font-bold uppercase">{selectedMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                        <span className="text-muted-foreground font-medium">Total</span>
                        <span className="font-bold text-primary">{formatIdr(selectedPkg.amountIdr)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
                      Ini adalah demo UI Midtrans. Pembayaran akan disimulasikan.
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setTopupStep("select")}>
                        Batal
                      </Button>
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                        disabled={isSubmitting}
                        onClick={handleStartTopup}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Bayar Sekarang
                      </Button>
                    </div>
                  </div>
                )}

                {topupStep === "paying" && selectedPkg && (
                  <div className="space-y-6 text-center">
                    <div className="w-32 h-32 rounded-2xl border-2 border-primary/30 bg-secondary/50 mx-auto flex items-center justify-center">
                      {selectedMethod === "qris"
                        ? <QrCode className="w-16 h-16 text-primary/50" />
                        : <Smartphone className="w-16 h-16 text-primary/50" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{formatIdr(selectedPkg.amountIdr)}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {selectedMethod === "qris"
                          ? "Scan QR code dengan aplikasi e-wallet kamu"
                          : `Buka aplikasi ${selectedMethod.toUpperCase()} dan selesaikan pembayaran`}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
                      Demo: Klik tombol di bawah untuk simulasikan pembayaran berhasil
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleReset}>
                        Batal
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold"
                        disabled={isSubmitting}
                        onClick={handleConfirmPayment}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Konfirmasi Bayar
                      </Button>
                    </div>
                  </div>
                )}

                {topupStep === "done" && selectedPkg && (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-display">Top-up Berhasil!</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {formatIdr(selectedPkg.amountIdr)} sudah masuk ke saldomu
                      </p>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" onClick={handleReset}>
                      Top-up Lagi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TRANSACTION HISTORY */}
          <div>
            <h2 className="text-xl font-display font-bold mb-4">Riwayat Transaksi</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                {isLoadingTx ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 rounded-lg bg-secondary/50 animate-pulse" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada transaksi</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => {
                      const isPositive = tx.amountIdr > 0;
                      const typeInfo = txTypeLabel[tx.type] || { label: tx.type, color: "text-muted-foreground" };
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", typeInfo.color)}>
                                {typeInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                          </div>
                          <span className={cn("font-mono font-bold text-sm ml-2 shrink-0", isPositive ? "text-green-500" : "text-red-400")}>
                            {isPositive ? "+" : ""}{formatIdr(tx.amountIdr)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
