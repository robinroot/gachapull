import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useGetPack, useGachaPull } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, Sparkles, ArrowLeft, RefreshCw, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, { border: string; glow: string; badge: string; label: string }> = {
  legendary: { border: "border-[hsl(0,84%,60%)]", glow: "shadow-[0_0_40px_hsla(0,84%,60%,0.6)]", badge: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]", label: "LEGENDARY" },
  ultra_rare: { border: "border-[hsl(270,70%,60%)]", glow: "shadow-[0_0_40px_hsla(270,70%,60%,0.6)]", badge: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]", label: "ULTRA RARE" },
  super_rare: { border: "border-[hsl(210,100%,60%)]", glow: "shadow-[0_0_40px_hsla(210,100%,60%,0.5)]", badge: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]", label: "SUPER RARE" },
  rare: { border: "border-[hsl(140,70%,50%)]", glow: "shadow-[0_0_30px_hsla(140,70%,50%,0.4)]", badge: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]", label: "RARE" },
  common: { border: "border-border", glow: "", badge: "bg-secondary text-muted-foreground border-border", label: "COMMON" },
};

type PulledCard = {
  id: number;
  name: string;
  rarity: string;
  imageUrl: string | null;
  franchise: string;
  isNew?: boolean;
};

type PullState = "idle" | "pulling" | "reveal";

export default function GachaPage() {
  const { packId } = useParams<{ packId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: pack } = useGetPack(Number(packId));
  const pullMutation = useGachaPull();
  useTitle(pack?.name ? `Pull - ${pack.name}` : "Pull");

  const [pullState, setPullState] = useState<PullState>("idle");
  const [cards, setCards] = useState<PulledCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [quantity, setQuantity] = useState<1 | 10>(1);

  const packData = pack as any;
  const priceIdr: number = packData?.priceIdr || 0;
  const balanceIdr: number = (user as any)?.balanceIdr || 0;
  const totalCost = priceIdr * quantity;
  const canAfford = balanceIdr >= totalCost;

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const handlePull = async () => {
    if (!pack) return;
    if (!canAfford) {
      toast.error(`Saldo tidak cukup. Kamu butuh ${formatIdr(totalCost)} tapi hanya punya ${formatIdr(balanceIdr)}`);
      return;
    }
    setPullState("pulling");
    try {
      const result = await pullMutation.mutateAsync({ data: { packId: Number(packId), pullCount: quantity } });
      const flatCards = ((result as any).cards as Array<{ card: PulledCard; isNew: boolean }>).map((item) => ({
        ...item.card,
        isNew: item.isNew,
      }));
      setCards(flatCards);
      setFlipped(new Array(flatCards.length).fill(false));
      setCurrentCardIndex(0);
      setTimeout(() => setPullState("reveal"), 600);
    } catch (err: unknown) {
      const error = err as { data?: { error?: string; message?: string }; message?: string };
      toast.error(error?.data?.error || error?.data?.message || error?.message || "Pull gagal");
      setPullState("idle");
    }
  };

  const handleFlipCard = (idx: number) => {
    setFlipped((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    if (idx === currentCardIndex) {
      setCurrentCardIndex((prev) => Math.min(prev + 1, cards.length));
    }
  };

  const handleReset = () => {
    setPullState("idle");
    setCards([]);
    setFlipped([]);
    setCurrentCardIndex(0);
  };

  const allFlipped = flipped.length > 0 && flipped.every(Boolean);

  if (!pack) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="text-muted-foreground">Memuat pack...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/packs">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Packs
            </Button>
          </Link>
          <Link href="/wallet">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border hover:bg-secondary transition-colors cursor-pointer">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-mono font-bold text-primary">{formatIdr(balanceIdr)}</span>
            </div>
          </Link>
        </div>

        {/* Pack info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">{pack.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {(pack as any).franchise === "onepiece" ? "One Piece" : "Pokemon"}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {formatIdr(priceIdr)} per pull
            </span>
          </div>
        </div>

        {/* IDLE STATE */}
        {pullState === "idle" && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div
                className="w-64 h-64 rounded-2xl border-2 border-primary/30 bg-card flex items-center justify-center cursor-pointer hover:border-primary/70 transition-all duration-300 hover:shadow-[0_0_40px_hsla(43,96%,58%,0.3)]"
                onClick={handlePull}
              >
                <img
                  src={(pack as any).imageUrl || ""}
                  alt={pack.name}
                  className="w-48 h-48 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground font-bold px-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Klik untuk Pull!
                </Badge>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-2">
              <Button
                variant={quantity === 1 ? "default" : "outline"}
                onClick={() => setQuantity(1)}
                className={quantity === 1 ? "bg-primary text-primary-foreground" : ""}
              >
                Pull x1
              </Button>
              <Button
                variant={quantity === 10 ? "default" : "outline"}
                onClick={() => setQuantity(10)}
                className={quantity === 10 ? "bg-primary text-primary-foreground" : ""}
              >
                Pull x10
              </Button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-bold mb-1">
                <Wallet className="w-5 h-5 text-primary" />
                <span className={cn("font-mono", canAfford ? "text-primary" : "text-destructive")}>{formatIdr(totalCost)}</span>
              </div>
              <p className={cn("text-xs", canAfford ? "text-muted-foreground" : "text-destructive font-medium")}>
                {canAfford
                  ? `Saldo kamu: ${formatIdr(balanceIdr)}`
                  : `Saldo tidak cukup! Kamu hanya punya ${formatIdr(balanceIdr)}`}
              </p>
              {!canAfford && (
                <Link href="/wallet">
                  <Button variant="link" size="sm" className="mt-1 text-primary">Top-up saldo →</Button>
                </Link>
              )}
            </div>

            <Button
              size="lg"
              onClick={handlePull}
              disabled={!canAfford}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-12 shadow-[0_0_20px_hsla(43,96%,58%,0.4)] disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Pull {quantity === 1 ? "1 Kartu" : "10 Kartu"}!
            </Button>
          </div>
        )}

        {/* PULLING STATE */}
        {pullState === "pulling" && (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <div className="absolute inset-4 rounded-full border-4 border-primary/20 border-b-primary animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-xl font-display font-bold text-primary animate-pulse">Menarik kartu...</p>
          </div>
        )}

        {/* REVEAL STATE */}
        {pullState === "reveal" && cards.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              {cards.map((card, idx) => {
                const rarity = RARITY_STYLES[card.rarity] || RARITY_STYLES.common;
                const isFlippable = idx === currentCardIndex && !flipped[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => isFlippable && handleFlipCard(idx)}
                    className={cn(
                      "relative aspect-[2/3] rounded-xl border-2 overflow-hidden transition-all duration-500 cursor-pointer",
                      flipped[idx]
                        ? cn(rarity.border, rarity.glow, "scale-105")
                        : isFlippable
                          ? "border-primary/50 hover:border-primary hover:shadow-[0_0_20px_hsla(43,96%,58%,0.3)] animate-pulse"
                          : "border-border opacity-60 cursor-default"
                    )}
                  >
                    {flipped[idx] ? (
                      <div className="absolute inset-0 flex flex-col items-center">
                        <div className="flex-1 bg-secondary/30 w-full flex items-center justify-center p-3">
                          <img
                            src={card.imageUrl || ""}
                            alt={card.name}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x150/1a1a2e/FFD700?text=Card"; }}
                          />
                        </div>
                        <div className="p-2 w-full bg-card">
                          <p className="text-xs font-bold truncate">{card.name}</p>
                          <Badge className={cn("text-[9px] px-1.5 mt-1 border", rarity.badge)}>
                            {rarity.label}
                          </Badge>
                          {card.isNew && (
                            <Badge className="text-[9px] px-1.5 mt-1 ml-1 bg-primary/20 text-primary border-primary/50">
                              BARU
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                        <div className="text-center">
                          <div className="w-12 h-16 rounded-lg border-2 border-primary/30 bg-primary/5 mx-auto flex items-center justify-center mb-2">
                            <Sparkles className="w-6 h-6 text-primary/50" />
                          </div>
                          {isFlippable && <p className="text-xs text-primary font-bold">Tap!</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allFlipped ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Kartu ditambahkan ke koleksimu!</p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleReset} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pull Lagi
                  </Button>
                  <Link href="/collection">
                    <Button variant="outline">Lihat Koleksi</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button variant="ghost" onClick={() => {
                  setFlipped(new Array(cards.length).fill(true));
                  setCurrentCardIndex(cards.length);
                }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Buka Semua
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
