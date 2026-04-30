import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetCollection, useGetCollectionStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, string> = {
  legendary: "border-[hsl(0,84%,60%)] shadow-[0_0_20px_hsla(0,84%,60%,0.4)]",
  ultra_rare: "border-[hsl(270,70%,60%)] shadow-[0_0_15px_hsla(270,70%,60%,0.4)]",
  super_rare: "border-[hsl(210,100%,60%)] shadow-[0_0_15px_hsla(210,100%,60%,0.3)]",
  rare: "border-[hsl(140,70%,50%)]",
  common: "border-border",
};

const RARITY_BADGE: Record<string, string> = {
  legendary: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",
  ultra_rare: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]",
  super_rare: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]",
  rare: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",
  common: "bg-secondary text-muted-foreground border-border",
};

type CollectionEntry = {
  card: { id: number; name: string; rarity: string; imageUrl?: string | null; franchise?: string };
  count: number;
  firstObtainedAt: string;
};

export default function CollectionPage() {
  useTitle("Collection");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [franchise, setFranchise] = useState<string | undefined>(undefined);
  const [rarity, setRarity] = useState<string | undefined>(undefined);

  const { data, isLoading } = useGetCollection({ franchise, rarity });
  const { data: stats } = useGetCollectionStats();

  const collection = (data || []) as unknown as CollectionEntry[];

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">My Collection</h1>
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { label: "Total Cards", value: (stats as { totalCards?: number }).totalCards || 0 },
                { label: "Unique Cards", value: (stats as { uniqueCards?: number }).uniqueCards || 0 },
                { label: "Legendary", value: (stats as { byRarity?: { legendary?: number } }).byRarity?.legendary || 0 },
                { label: "Ultra Rare", value: (stats as { byRarity?: { ultra_rare?: number } }).byRarity?.ultra_rare || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 py-2 bg-card rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "All", value: undefined },
              { label: "Pokemon", value: "pokemon" },
              { label: "One Piece", value: "onepiece" },
            ].map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                variant={franchise === value ? "default" : "outline"}
                onClick={() => setFranchise(value)}
                className={franchise === value ? "bg-primary text-primary-foreground" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "All Rarities", value: undefined },
              { label: "Legendary", value: "legendary" },
              { label: "Ultra Rare", value: "ultra_rare" },
              { label: "Super Rare", value: "super_rare" },
              { label: "Rare", value: "rare" },
              { label: "Common", value: "common" },
            ].map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                variant={rarity === value ? "default" : "outline"}
                onClick={() => setRarity(value)}
                className={rarity === value ? "bg-primary text-primary-foreground" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : collection.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-display font-bold mb-2">No Cards Yet</p>
            <p className="text-muted-foreground mb-6">Start pulling packs to build your collection!</p>
            <Link href="/packs">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Browse Packs</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {collection.map((item, idx) => {
              const cardRarity = item.card?.rarity || "common";
              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative rounded-xl border-2 bg-card overflow-hidden transition-all duration-300 hover:scale-105",
                    RARITY_STYLES[cardRarity] || "border-border"
                  )}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-secondary/30">
                    <img
                      src={item.card?.imageUrl || ""}
                      alt={item.card?.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x150/1a1a2e/FFD700?text=Card"; }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold truncate">{item.card?.name}</p>
                    <Badge className={cn("text-[9px] px-1.5 mt-1 border", RARITY_BADGE[cardRarity] || RARITY_BADGE.common)}>
                      {cardRarity.replace("_", " ").toUpperCase()}
                    </Badge>
                    {item.count > 1 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 mt-1 ml-1">
                        x{item.count}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
