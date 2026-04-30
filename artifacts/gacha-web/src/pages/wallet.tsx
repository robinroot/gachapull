import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetWallet,
  useGetWalletTransactions,
  useGetCoinPackages,
  useCreateStripeSession,
  useCreateUsdtPayment,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle, formatCoins, formatUsd } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Coins,
  CreditCard,
  Bitcoin,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  useTitle("Wallet");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: wallet } = useGetWallet();
  const { data: txData } = useGetWalletTransactions();
  const { data: packages } = useGetCoinPackages();
  const stripeSession = useCreateStripeSession();
  const usdtPayment = useCreateUsdtPayment();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "usdt">("stripe");

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const transactions = (txData as { transactions?: Array<{ id: number; amount: number; type: string; description?: string | null; createdAt: string }> })?.transactions || [];

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error("Please select a coin package");
      return;
    }
    try {
      if (paymentMethod === "stripe") {
        const result = await stripeSession.mutateAsync({
          data: { coinPackageId: selectedPackage },
        });
        if (result.url) {
          window.open(result.url, "_blank");
        } else {
          toast.info("Stripe checkout created. Complete payment in the new tab.");
        }
      } else {
        const result = await usdtPayment.mutateAsync({
          data: { coinPackageId: selectedPackage },
        });
        const r = result as { address?: string; amount?: number };
        toast.success(`Send ${r.amount} USDT to: ${r.address}`, { duration: 10000 });
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Payment failed");
    }
  };

  const isPending = stripeSession.isPending || usdtPayment.isPending;

  const walletData = wallet as { balance?: number; totalEarned?: number; totalSpent?: number } | undefined;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">Wallet</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Wallet className="w-4 h-4" />
                Coin Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-3xl font-display font-bold text-primary">
                    {formatCoins(walletData?.balance || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">coins available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <ArrowDownLeft className="w-4 h-4 text-green-500" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{formatCoins(walletData?.totalEarned || 0)}</p>
              <p className="text-xs text-muted-foreground">coins earned</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 text-red-400" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{formatCoins(walletData?.totalSpent || 0)}</p>
              <p className="text-xs text-muted-foreground">coins spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Buy Coins */}
        <div className="mb-10">
          <h2 className="text-2xl font-display font-bold mb-6">Buy Coins</h2>

          <div className="flex gap-2 mb-6">
            <Button
              variant={paymentMethod === "stripe" ? "default" : "outline"}
              onClick={() => setPaymentMethod("stripe")}
              className={paymentMethod === "stripe" ? "bg-primary text-primary-foreground" : ""}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Card / Stripe
            </Button>
            <Button
              variant={paymentMethod === "usdt" ? "default" : "outline"}
              onClick={() => setPaymentMethod("usdt")}
              className={paymentMethod === "usdt" ? "bg-primary text-primary-foreground" : ""}
            >
              <Bitcoin className="w-4 h-4 mr-2" />
              USDT
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {(packages || []).map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                  selectedPackage === pkg.id
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_hsla(43,96%,58%,0.2)]"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {(pkg.bonusCoins ?? 0) > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary/50 text-xs mb-2">
                    +{pkg.bonusCoins} Bonus!
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-display font-bold text-primary">
                    {formatCoins(pkg.coins + (pkg.bonusCoins || 0))}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{pkg.name}</p>
                <p className="text-lg font-bold">{formatUsd(Number(pkg.priceUsd))}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={handlePurchase}
            disabled={!selectedPackage || isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {paymentMethod === "stripe" ? "Pay with Card" : "Pay with USDT"}
          </Button>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 15).map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    tx.type === "credit" ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {tx.type === "credit"
                      ? <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn(
                    "font-mono font-bold shrink-0 text-sm",
                    tx.type === "credit" ? "text-green-500" : "text-red-400"
                  )}>
                    {tx.type === "credit" ? "+" : "-"}{formatCoins(Math.abs(tx.amount))} coins
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
