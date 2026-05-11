import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Package, Star, Trophy, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_BADGE: Record<string, string> = {
  legendary: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",
  ultra_rare: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]",
  super_rare: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]",
  rare: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",
  common: "bg-secondary text-muted-foreground border-border",
};

type DashboardData = {
  balanceIdr: number;
  totalPulls: number;
  collectionCount: number;
  legendaryCount?: number;
  totalSpentIdr: number;
  recentPulls: Array<{
    id: number;
    pack: { id: number; name: string };
    card: { id: number; name: string; rarity: string; imageUrl?: string | null };
    pulledAt: string;
  }>;
};

export default function DashboardPage() {
  useTitle("Dashboard");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data, isLoading } = useGetDashboard();
  const dashboard = data as unknown as DashboardData | undefined;

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold">
            Selamat datang, <span className="text-primary">{user?.username}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">Ringkasan koleksimu</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Wallet, label: "Saldo", value: formatIdr(dashboard?.balanceIdr || 0), color: "text-primary" },
                { icon: Star, label: "Kartu Unik", value: dashboard?.collectionCount || 0, color: "text-foreground" },
                { icon: Package, label: "Total Pull", value: dashboard?.totalPulls || 0, color: "text-foreground" },
                { icon: Trophy, label: "Total Spent", value: formatIdr(Number(dashboard?.totalSpentIdr || 0)), color: "text-foreground" },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} className="bg-card border-border">
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 px-4">
                    <p className={cn("text-2xl font-display font-bold", color)}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {dashboard?.legendaryCount !== undefined && dashboard.legendaryCount > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-[hsl(0,84%,60%,0.3)] bg-[hsla(0,84%,60%,0.05)] flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[hsl(0,84%,60%)]" />
                <p className="font-bold text-sm">
                  Kamu punya <span className="text-[hsl(0,84%,60%)]">{dashboard.legendaryCount}</span> kartu legendary!
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/packs">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Pull Pack
                </Button>
              </Link>
              <Link href="/collection">
                <Button variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Koleksiku
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant="outline">
                  <Wallet className="w-4 h-4 mr-2" />
                  Top-up Saldo
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  Riwayat Pull
                </Button>
              </Link>
            </div>

            {dashboard?.recentPulls && dashboard.recentPulls.length > 0 && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Pull Terbaru</h2>
                <div className="space-y-2">
                  {dashboard.recentPulls.map((pull) => (
                    <div key={pull.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                        <img
                          src={pull.card?.imageUrl || ""}
                          alt={pull.card?.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/1a1a2e/FFD700?text=?"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pull.card?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          dari {pull.pack?.name} &bull; {new Date(pull.pulledAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <Badge className={cn("text-xs border shrink-0", RARITY_BADGE[pull.card?.rarity || "common"] || RARITY_BADGE.common)}>
                        {pull.card?.rarity?.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
