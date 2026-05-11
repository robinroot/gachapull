import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetFeaturedPacks, useGetFeaturedCards } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Sparkles, Wallet, Trophy, Package, Star, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, { border: string; glow: string; bg: string }> = {
  legendary:  { border: "border-red-500/60",    glow: "hover:glow-legendary",  bg: "bg-red-500/5"    },
  ultra_rare: { border: "border-purple-500/60", glow: "hover:glow-ultra-rare", bg: "bg-purple-500/5" },
  super_rare: { border: "border-blue-500/60",   glow: "hover:glow-super-rare", bg: "bg-blue-500/5"   },
  rare:       { border: "border-green-500/60",  glow: "hover:glow-rare",       bg: "bg-green-500/5"  },
  common:     { border: "border-border",         glow: "",                      bg: ""                },
};

const RARITY_BADGE: Record<string, string> = {
  legendary:  "bg-red-500/20    text-red-400    border-red-500/40",
  ultra_rare: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  super_rare: "bg-blue-500/20   text-blue-400   border-blue-500/40",
  rare:       "bg-green-500/20  text-green-400  border-green-500/40",
  common:     "bg-secondary     text-muted-foreground border-border",
};

export default function HomePage() {
  useTitle("Home");
  const { data: packs } = useGetFeaturedPacks();
  const { data: cards } = useGetFeaturedCards();

  return (
    <Layout>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-24 md:py-36">

        {/* Animated blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="bg-grid absolute inset-0 opacity-100" />
          <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-[420px] h-[420px] bg-purple-600/8 rounded-full blur-[90px] animate-blob delay-400" />
          <div className="absolute bottom-0 left-1/2 w-[360px] h-[360px] bg-blue-600/6 rounded-full blur-[80px] animate-blob delay-700" />
          <div className="absolute top-0 right-1/6 w-[280px] h-[280px] bg-yellow-600/5 rounded-full blur-[70px] animate-blob delay-200" />
          {/* Bottom vignette */}
          <div className="hero-vignette absolute inset-0" />
        </div>

        {/* Sparkle dots */}
        {[
          { top: "15%", left: "12%", delay: "0ms",    size: "w-1.5 h-1.5" },
          { top: "25%", left: "88%", delay: "700ms",  size: "w-1 h-1" },
          { top: "60%", left: "7%",  delay: "1200ms", size: "w-1 h-1" },
          { top: "70%", left: "92%", delay: "400ms",  size: "w-1.5 h-1.5" },
          { top: "40%", left: "95%", delay: "900ms",  size: "w-1 h-1" },
          { top: "80%", left: "20%", delay: "1400ms", size: "w-1 h-1" },
        ].map((s, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full bg-primary/70", s.size)}
            style={{ top: s.top, left: s.left, animation: `twinkle 3s ${s.delay} ease-in-out infinite` }}
          />
        ))}

        <div className="container mx-auto px-4 text-center relative">
          <div className="animate-fade-in-up">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 text-sm px-4 py-1.5 animate-border-pulse">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-float" />
              Pokemon & One Piece Cards
            </Badge>
          </div>

          <h1 className="animate-fade-in-up delay-150 text-5xl md:text-7xl font-display font-bold tracking-tighter mb-6 leading-tight">
            Pull Your{" "}
            <br className="md:hidden" />
            <span className="animate-shimmer-text">Dream Cards</span>
          </h1>

          <p className="animate-fade-in-up delay-300 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Collect rare Pokemon and One Piece cards with our gacha system.<br className="hidden md:block" />
            Build your collection, climb the leaderboard, and become a champion.
          </p>

          <div className="animate-fade-in-up delay-500 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/packs">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 text-base animate-pulse-glow transition-transform hover:scale-105 active:scale-95"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Pulling Now
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="font-bold px-10 text-base border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all hover:scale-105 active:scale-95"
              >
                <Trophy className="w-5 h-5 mr-2" />
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-y border-border/50 bg-secondary/10 py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Package, label: "Card Packs",   value: "4+",  delay: "delay-0"   },
              { icon: Star,    label: "Unique Cards",  value: "30+", delay: "delay-100" },
              { icon: Wallet,  label: "Top-up IDR",   value: "6",   delay: "delay-200" },
              { icon: Trophy,  label: "Rarity Tiers", value: "5",   delay: "delay-300" },
            ].map(({ icon: Icon, label, value, delay }) => (
              <div key={label} className={cn("text-center group animate-fade-in-up", delay)}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:scale-110 transition-all duration-300 group-hover:glow-primary">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-display font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PACKS ===== */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-display font-bold">Featured Packs</h2>
            <p className="text-muted-foreground mt-1">Choose your adventure</p>
          </div>
          <Link href="/packs">
            <Button variant="ghost" className="text-primary hover:text-primary/80 animate-fade-in-up delay-200">
              View All →
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(packs || []).slice(0, 4).map((pack, idx) => (
            <Link key={pack.id} href={`/packs/${pack.id}`}>
              <div
                className="card-shimmer group relative flex flex-col rounded-2xl border border-border bg-card hover:border-primary/60 transition-all duration-400 hover:shadow-[0_0_40px_hsla(43,96%,58%,0.18)] hover:-translate-y-2 overflow-hidden cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${idx * 100 + 200}ms` }}
              >
                {/* Top glow line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="aspect-square overflow-hidden bg-secondary/30 shrink-0 relative">
                  <img
                    src={pack.imageUrl || ""}
                    alt={pack.name}
                    className="w-full h-full object-contain p-6 group-hover:scale-115 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
                  />
                  {/* Inner gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <Badge variant="secondary" className="text-xs mb-2 capitalize w-fit">
                    {pack.franchise === "onepiece" ? "One Piece" : "Pokemon"}
                  </Badge>
                  <h3 className="font-bold text-sm flex-1">{pack.name}</h3>
                  <div className="flex items-center gap-1 text-primary font-mono font-bold text-sm mt-3">
                    <Wallet className="w-4 h-4" />
                    {formatIdr((pack as any).priceIdr || 0)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED CARDS ===== */}
      {cards && cards.length > 0 && (
        <section className="py-20 bg-secondary/5 border-y border-border/50 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/4 rounded-full blur-[80px]" />

          <div className="container mx-auto px-4 relative">
            <div className="flex items-center justify-between mb-10">
              <div className="animate-fade-in-up">
                <h2 className="text-3xl font-display font-bold">Featured Cards</h2>
                <p className="text-muted-foreground mt-1">Rare finds awaiting you</p>
              </div>
              <div className="animate-fade-in-up delay-200 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-float" />
                Pull to discover
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.slice(0, 12).map((card, idx) => {
                const style = RARITY_STYLES[card.rarity] || RARITY_STYLES.common;
                const badge = RARITY_BADGE[card.rarity] || RARITY_BADGE.common;
                return (
                  <div
                    key={card.id}
                    className={cn(
                      "card-shimmer group relative rounded-xl border-2 bg-card overflow-hidden",
                      "transition-all duration-300 hover:-translate-y-3 cursor-pointer animate-fade-in-up",
                      style.border, style.glow, style.bg
                    )}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Rarity corner accent */}
                    {(card.rarity === "legendary" || card.rarity === "ultra_rare") && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <Sparkles className={cn(
                          "w-3 h-3 animate-float",
                          card.rarity === "legendary" ? "text-red-400" : "text-purple-400"
                        )} />
                      </div>
                    )}

                    <div className="aspect-[2/3] overflow-hidden bg-secondary/30">
                      <img
                        src={card.imageUrl || ""}
                        alt={card.name}
                        className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-400"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x150/1a1a2e/FFD700?text=Card"; }}
                      />
                    </div>

                    <div className="p-2">
                      <p className="text-xs font-bold truncate">{card.name}</p>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-medium capitalize inline-block mt-0.5", badge)}>
                        {card.rarity.replace("_", " ")}
                      </span>
                    </div>

                    {/* Scan line effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                      <div
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        style={{ animation: "scanline 1s ease-in-out infinite" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="py-24 container mx-auto px-4 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/8 rounded-full blur-[80px] animate-pulse-glow" />
        </div>

        <div className="animate-fade-in-up inline-flex items-center gap-2 text-xs text-muted-foreground border border-border/50 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Server online — pull sekarang!
        </div>

        <h2 className="animate-fade-in-up delay-100 text-4xl md:text-5xl font-display font-bold mb-4">
          Ready to Start{" "}
          <span className="animate-shimmer-text">Collecting?</span>
        </h2>
        <p className="animate-fade-in-up delay-200 text-muted-foreground mb-10 max-w-lg mx-auto text-lg">
          Daftar gratis, isi saldo IDR, dan mulai pull kartu impianmu sekarang!
        </p>
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-12 text-base animate-pulse-glow hover:scale-105 active:scale-95 transition-transform"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Free Account
            </Button>
          </Link>
          <Link href="/packs">
            <Button size="lg" variant="outline" className="font-bold px-10 text-base hover:border-primary/50 hover:scale-105 transition-all">
              Browse Packs
            </Button>
          </Link>
        </div>
      </section>

    </Layout>
  );
}
