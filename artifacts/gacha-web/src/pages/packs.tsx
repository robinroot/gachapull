import { useState } from "react";
import { Link } from "wouter";
import { useListPacks } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Package, Filter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FRANCHISE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pokemon:  { label: "Pokemon",  color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  onepiece: { label: "One Piece", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" },
};

export default function PacksPage() {
  useTitle("Packs");
  const [franchise, setFranchise] = useState<string | undefined>(undefined);
  const { data: packs, isLoading } = useListPacks({ franchise });
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-display font-bold">Card Packs</h1>
            <p className="text-muted-foreground mt-1">Pilih pack dan mulai pull!</p>
          </div>
          <div className="flex items-center gap-2 animate-fade-in-up delay-200">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {[
              { label: "Semua",    value: undefined   },
              { label: "Pokemon",  value: "pokemon"   },
              { label: "One Piece", value: "onepiece" },
            ].map(({ label, value }) => (
              <Button
                key={label}
                variant={franchise === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFranchise(value)}
                className={cn(
                  "transition-all duration-200",
                  franchise === value
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsla(43,96%,58%,0.4)]"
                    : "hover:border-primary/40"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(packs || []).map((pack, idx) => {
              const p = pack as any;
              const fc = FRANCHISE_CONFIG[p.franchise] || FRANCHISE_CONFIG.pokemon;
              return (
                <div
                  key={pack.id}
                  className="card-shimmer group relative flex flex-col rounded-2xl border border-border bg-card hover:border-primary/60 transition-all duration-400 hover:shadow-[0_0_45px_hsla(43,96%,58%,0.18)] hover:-translate-y-2 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  {/* Top highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-secondary/30 shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20 z-10" />
                    <img
                      src={pack.imageUrl || ""}
                      alt={pack.name}
                      className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
                    />
                    {/* Hover inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <Badge className={cn("text-xs mb-2 capitalize w-fit border", fc.bg, fc.color)}>
                      {fc.label}
                    </Badge>
                    <h3 className="font-bold text-base mb-1 group-hover:text-primary/90 transition-colors">{pack.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{pack.description}</p>
                    <div className="flex items-center gap-1.5 text-primary font-mono font-bold text-lg mb-4">
                      <Wallet className="w-5 h-5" />
                      {formatIdr(p.priceIdr || 0)}
                    </div>

                    {isAuthenticated ? (
                      <Link href={`/gacha/${pack.id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold group-hover:shadow-[0_0_16px_hsla(43,96%,58%,0.4)] transition-shadow">
                          <Package className="w-4 h-4 mr-2" />
                          Pull Sekarang
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <Button variant="outline" className="w-full font-bold hover:border-primary/50">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Login untuk Pull
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Bottom shimmer bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
