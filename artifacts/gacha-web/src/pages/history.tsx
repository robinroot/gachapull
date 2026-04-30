import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetGachaHistory } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, History } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_BADGE: Record<string, string> = {
  legendary: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",
  ultra_rare: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]",
  super_rare: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]",
  rare: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",
  common: "bg-secondary text-muted-foreground border-border",
};

export default function HistoryPage() {
  useTitle("Pull History");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useGetGachaHistory();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const pulls = data?.pulls || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-4xl font-display font-bold">Pull History</h1>
            <p className="text-muted-foreground text-sm">
              {data?.total ? `${data.total} total pulls` : "Your recent gacha pulls"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : pulls.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-display font-bold mb-2">No Pulls Yet</p>
            <p className="text-muted-foreground mb-6">Start pulling packs to see your history here!</p>
            <Link href="/packs">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Browse Packs</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pulls.map((pull) => (
              <div key={pull.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/10 transition-colors">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/30 shrink-0 flex items-center justify-center">
                  <img
                    src={pull.card?.imageUrl || ""}
                    alt={pull.card?.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48/1a1a2e/FFD700?text=?"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{pull.card?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    from <span className="text-foreground/80">{pull.pack?.name}</span> &bull; {new Date(pull.pulledAt).toLocaleString()}
                  </p>
                </div>
                <Badge className={cn("text-xs border shrink-0", RARITY_BADGE[pull.card?.rarity || "common"] || RARITY_BADGE.common)}>
                  {pull.card?.rarity?.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
