import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetFeaturedPacks, useGetFeaturedCards } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { Sparkles, Coins, Trophy, Package, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, string> = {
  legendary: "border-[hsl(0,84%,60%)] bg-[hsla(0,84%,60%,0.1)] text-[hsl(0,84%,60%)]",
  ultra_rare: "border-[hsl(270,70%,60%)] bg-[hsla(270,70%,60%,0.1)] text-[hsl(270,70%,60%)]",
  super_rare: "border-[hsl(210,100%,60%)] bg-[hsla(210,100%,60%,0.1)] text-[hsl(210,100%,60%)]",
  rare: "border-[hsl(140,70%,50%)] bg-[hsla(140,70%,50%,0.1)] text-[hsl(140,70%,50%)]",
  common: "border-border text-muted-foreground",
};

export default function HomePage() {
  useTitle("Home");
  const { data: packs } = useGetFeaturedPacks();
  const { data: cards } = useGetFeaturedCards();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 text-sm px-4 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Pokemon & One Piece Cards
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-6">
            Pull Your{" "}
            <span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              Dream Cards
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Collect rare Pokemon and One Piece cards with our gacha system. Build your collection, climb the leaderboard, and become a champion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/packs">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 shadow-[0_0_20px_hsla(43,96%,58%,0.4)]">
                <Zap className="w-5 h-5 mr-2" />
                Start Pulling Now
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="font-bold px-8">
                <Trophy className="w-5 h-5 mr-2" />
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Package, label: "Card Packs", value: "4+" },
              { icon: Star, label: "Unique Cards", value: "30+" },
              { icon: Coins, label: "Coin Packages", value: "6" },
              { icon: Trophy, label: "Rarity Tiers", value: "5" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-display font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packs */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold">Featured Packs</h2>
            <p className="text-muted-foreground mt-1">Choose your adventure</p>
          </div>
          <Link href="/packs">
            <Button variant="ghost" className="text-primary hover:text-primary/80">View All →</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(packs || []).slice(0, 4).map((pack) => (
            <Link key={pack.id} href={`/packs/${pack.id}`}>
              <div className="group relative rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsla(43,96%,58%,0.15)] overflow-hidden cursor-pointer">
                <div className="aspect-square overflow-hidden bg-secondary/30">
                  <img
                    src={pack.imageUrl || ""}
                    alt={pack.name}
                    className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
                  />
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="text-xs mb-2 capitalize">
                    {pack.franchise === "onepiece" ? "One Piece" : "Pokemon"}
                  </Badge>
                  <h3 className="font-bold text-sm">{pack.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-primary font-mono font-bold">
                      <Coins className="w-4 h-4" />
                      {pack.priceCoins}
                    </div>
                    <span className="text-xs text-muted-foreground">${pack.priceUsd}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Cards */}
      {cards && cards.length > 0 && (
        <section className="py-16 bg-secondary/10 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold">Featured Cards</h2>
                <p className="text-muted-foreground mt-1">Rare finds awaiting you</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.slice(0, 12).map((card) => (
                <div
                  key={card.id}
                  className={cn(
                    "group relative rounded-xl border-2 bg-card overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer",
                    RARITY_STYLES[card.rarity] || "border-border"
                  )}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-secondary/30">
                    <img
                      src={card.imageUrl || ""}
                      alt={card.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x150/1a1a2e/FFD700?text=Card"; }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold truncate">{card.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{card.rarity.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 container mx-auto px-4 text-center">
        <h2 className="text-4xl font-display font-bold mb-4">Ready to Start Collecting?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Create your account, get your coins, and start pulling cards today!
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 shadow-[0_0_20px_hsla(43,96%,58%,0.4)]">
            Create Free Account
          </Button>
        </Link>
      </section>
    </Layout>
  );
}
