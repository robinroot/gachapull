import { useState } from "react";
import { Link } from "wouter";
import { useListPacks } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Package, Filter } from "lucide-react";

export default function PacksPage() {
  useTitle("Packs");
  const [franchise, setFranchise] = useState<string | undefined>(undefined);
  const { data: packs, isLoading } = useListPacks({ franchise });
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold">Card Packs</h1>
            <p className="text-muted-foreground mt-1">Choose a pack and start pulling!</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {[
              { label: "All", value: undefined },
              { label: "Pokemon", value: "pokemon" },
              { label: "One Piece", value: "onepiece" },
            ].map(({ label, value }) => (
              <Button
                key={label}
                variant={franchise === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFranchise(value)}
                className={franchise === value ? "bg-primary text-primary-foreground" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(packs || []).map((pack) => (
              <div
                key={pack.id}
                className="group relative rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsla(43,96%,58%,0.15)] overflow-hidden"
              >
                <div className="aspect-square overflow-hidden bg-secondary/30">
                  <img
                    src={pack.imageUrl || ""}
                    alt={pack.name}
                    className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
                  />
                </div>
                <div className="p-5">
                  <Badge variant="secondary" className="text-xs mb-2 capitalize">
                    {pack.franchise === "onepiece" ? "One Piece" : "Pokemon"}
                  </Badge>
                  <h3 className="font-bold text-base mb-1">{pack.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{pack.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-primary font-mono font-bold text-lg">
                      <Coins className="w-5 h-5" />
                      {pack.priceCoins}
                    </div>
                    <span className="text-sm text-muted-foreground">${pack.priceUsd}</span>
                  </div>
                  {isAuthenticated ? (
                    <Link href={`/gacha/${pack.id}`}>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                        <Package className="w-4 h-4 mr-2" />
                        Pull Now
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button variant="outline" className="w-full font-bold">
                        Login to Pull
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
