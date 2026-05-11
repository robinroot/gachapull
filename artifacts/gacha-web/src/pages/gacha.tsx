import { useState, useEffect, useRef, useCallback } from "react";
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

// ─── Rarity config ───────────────────────────────────────────────────────────
const RARITY_STYLES: Record<string, { border: string; glow: string; badge: string; label: string; flash: string }> = {
  legendary: { border: "border-[hsl(0,84%,60%)]",    glow: "shadow-[0_0_50px_hsla(0,84%,60%,0.8)]",    badge: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",    label: "LEGENDARY",  flash: "hsla(43,96%,58%,0.35)" },
  ultra_rare: { border: "border-[hsl(270,70%,60%)]",  glow: "shadow-[0_0_50px_hsla(270,70%,60%,0.7)]",  badge: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]", label: "ULTRA RARE", flash: "hsla(270,70%,60%,0.3)" },
  super_rare: { border: "border-[hsl(210,100%,60%)]", glow: "shadow-[0_0_40px_hsla(210,100%,60%,0.6)]", badge: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]", label: "SUPER RARE", flash: "hsla(210,100%,60%,0.2)" },
  rare: { border: "border-[hsl(140,70%,50%)]",  glow: "shadow-[0_0_30px_hsla(140,70%,50%,0.5)]",  badge: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",  label: "RARE",       flash: "" },
  common: { border: "border-border", glow: "", badge: "bg-secondary text-muted-foreground border-border", label: "COMMON", flash: "" },
};

// ─── Sound effects via Web Audio API ─────────────────────────────────────────
function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playPull = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    // Ascending whoosh sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 1000;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
    // Pulsing rhythm during spin
    for (let i = 0; i < 4; i++) {
      const click = ctx.createOscillator();
      const cGain = ctx.createGain();
      click.connect(cGain); cGain.connect(ctx.destination);
      click.type = "sine"; click.frequency.value = 300 + i * 80;
      const t = ctx.currentTime + 0.05 + i * 0.12;
      cGain.gain.setValueAtTime(0.12, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      click.start(t); click.stop(t + 0.1);
    }
  }, [getCtx]);

  const playFlip = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    // Card snap sound
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 2000;
    src.buffer = buf;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    src.start();
  }, [getCtx]);

  const playReveal = useCallback((rarity: string) => {
    const ctx = getCtx(); if (!ctx) return;
    const configs: Record<string, { freqs: number[]; type: OscillatorType; spacing: number; vol: number }> = {
      common:     { freqs: [523],                          type: "sine",     spacing: 0,    vol: 0.15 },
      rare:       { freqs: [523, 659],                     type: "sine",     spacing: 0.1,  vol: 0.18 },
      super_rare: { freqs: [523, 659, 784],                type: "triangle", spacing: 0.09, vol: 0.20 },
      ultra_rare: { freqs: [392, 523, 659, 880],           type: "triangle", spacing: 0.08, vol: 0.22 },
      legendary:  { freqs: [261, 329, 392, 523, 784, 1046], type: "triangle", spacing: 0.1, vol: 0.25 },
    };
    const cfg = configs[rarity] || configs.common;
    cfg.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = cfg.type;
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * cfg.spacing;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(cfg.vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.55);
    });
    // Impact thud for high rarity
    if (["ultra_rare", "legendary"].includes(rarity)) {
      const thud = ctx.createOscillator();
      const tGain = ctx.createGain();
      thud.type = "sine"; thud.frequency.setValueAtTime(80, ctx.currentTime);
      thud.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
      thud.connect(tGain); tGain.connect(ctx.destination);
      tGain.gain.setValueAtTime(0.4, ctx.currentTime);
      tGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      thud.start(ctx.currentTime); thud.stop(ctx.currentTime + 0.3);
    }
  }, [getCtx]);

  const playVictory = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    [523, 659, 784, 1046, 1318].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  }, [getCtx]);

  return { playPull, playFlip, playReveal, playVictory };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PulledCard = {
  id: number; name: string; rarity: string;
  imageUrl: string | null; franchise: string; isNew?: boolean;
};
type PullState = "idle" | "pulling" | "reveal";

// ─── Flash overlay component ──────────────────────────────────────────────────
function FlashOverlay({ color }: { color: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        background: color,
        animation: "gacha-flash 0.6s ease-out forwards",
      }}
    />
  );
}

// ─── Sparkle particles for legendary ─────────────────────────────────────────
function LegendaryParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.4,
    dur: 0.6 + Math.random() * 0.5,
  }));
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[hsl(43,96%,58%)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `gacha-particle ${p.dur}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GachaPage() {
  const { packId } = useParams<{ packId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, refetchUser } = useAuth();
  const { data: pack } = useGetPack(Number(packId));
  const pullMutation = useGachaPull();
  useTitle(pack?.name ? `Pull - ${pack.name}` : "Pull");
  const sounds = useSoundEffects();

  const [pullState, setPullState] = useState<PullState>("idle");
  const [cards, setCards] = useState<PulledCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [quantity, setQuantity] = useState<1 | 10>(1);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);

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
    sounds.playPull();
    setPullState("pulling");
    try {
      const result = await pullMutation.mutateAsync({ data: { packId: Number(packId), pullCount: quantity } });
      const flatCards = ((result as any).cards as Array<{ card: PulledCard; isNew: boolean }>).map((item) => ({
        ...item.card, isNew: item.isNew,
      }));
      setCards(flatCards);
      setFlipped(new Array(flatCards.length).fill(false));
      setCurrentCardIndex(0);
      refetchUser();
      setTimeout(() => setPullState("reveal"), 700);
    } catch (err: unknown) {
      const error = err as { data?: { error?: string; message?: string }; message?: string };
      toast.error(error?.data?.error || error?.data?.message || error?.message || "Pull gagal");
      setPullState("idle");
    }
  };

  const handleFlipCard = (idx: number) => {
    sounds.playFlip();
    setFlipped((prev) => {
      const next = [...prev]; next[idx] = true; return next;
    });
    if (idx === currentCardIndex) {
      setCurrentCardIndex((prev) => Math.min(prev + 1, cards.length));
    }
    const card = cards[idx];
    setTimeout(() => {
      sounds.playReveal(card.rarity);
      const flashCol = RARITY_STYLES[card.rarity]?.flash;
      if (flashCol) {
        setFlashColor(flashCol);
        setTimeout(() => setFlashColor(null), 650);
      }
      if (card.rarity === "legendary") {
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1200);
      }
    }, 300);
  };

  const handleRevealAll = () => {
    cards.forEach((card, idx) => {
      if (!flipped[idx]) {
        setTimeout(() => {
          sounds.playFlip();
          setTimeout(() => sounds.playReveal(card.rarity), 200);
        }, idx * 80);
      }
    });
    setFlipped(new Array(cards.length).fill(true));
    setCurrentCardIndex(cards.length);
  };

  const handleReset = () => {
    setPullState("idle");
    setCards([]);
    setFlipped([]);
    setCurrentCardIndex(0);
  };

  const allFlipped = flipped.length > 0 && flipped.every(Boolean);

  useEffect(() => {
    if (allFlipped && cards.length > 0) {
      setTimeout(() => sounds.playVictory(), 200);
    }
  }, [allFlipped]);

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
      {/* CSS for flip animation + flash + particles */}
      <style>{`
        @keyframes gacha-flash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gacha-particle {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(${Math.random()>0.5?'':'-'}${30+Math.random()*80}px, -${50+Math.random()*120}px) scale(0); }
        }
        .card-3d { perspective: 1000px; }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-inner.is-flipped { transform: rotateY(180deg); }
        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .card-face-back { transform: rotateY(180deg); }
        @keyframes gacha-ring-pulse {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .gacha-ring {
          position: absolute;
          inset: -20px;
          border-radius: 9999px;
          border: 2px solid hsl(43,96%,58%);
          animation: gacha-ring-pulse 0.9s ease-out infinite;
        }
        .gacha-ring:nth-child(2) { animation-delay: 0.3s; }
        .gacha-ring:nth-child(3) { animation-delay: 0.6s; }
        @keyframes card-shine {
          0%   { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(300%) rotate(25deg); }
        }
        .card-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
          transform: translateX(-100%) rotate(25deg);
          animation: card-shine 1.5s ease-in-out 0.3s 1;
        }
      `}</style>

      {/* Flash overlay */}
      {flashColor && <FlashOverlay color={flashColor} />}
      {showParticles && <LegendaryParticles />}

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
            <span className="text-muted-foreground text-sm">{formatIdr(priceIdr)} per pull</span>
          </div>
        </div>

        {/* ── IDLE ── */}
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
                  className="w-48 h-48 object-contain transition-transform duration-300 hover:scale-110"
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

            <div className="flex items-center gap-2">
              <Button variant={quantity === 1 ? "default" : "outline"} onClick={() => setQuantity(1)}
                className={quantity === 1 ? "bg-primary text-primary-foreground" : ""}>
                Pull x1
              </Button>
              <Button variant={quantity === 10 ? "default" : "outline"} onClick={() => setQuantity(10)}
                className={quantity === 10 ? "bg-primary text-primary-foreground" : ""}>
                Pull x10
              </Button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-bold mb-1">
                <Wallet className="w-5 h-5 text-primary" />
                <span className={cn("font-mono", canAfford ? "text-primary" : "text-destructive")}>{formatIdr(totalCost)}</span>
              </div>
              <p className={cn("text-xs", canAfford ? "text-muted-foreground" : "text-destructive font-medium")}>
                {canAfford ? `Saldo kamu: ${formatIdr(balanceIdr)}` : `Saldo tidak cukup! Kamu hanya punya ${formatIdr(balanceIdr)}`}
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-12 shadow-[0_0_20px_hsla(43,96%,58%,0.4)] disabled:opacity-50 hover:shadow-[0_0_35px_hsla(43,96%,58%,0.6)] transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Pull {quantity === 1 ? "1 Kartu" : "10 Kartu"}!
            </Button>
          </div>
        )}

        {/* ── PULLING ── */}
        {pullState === "pulling" && (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="gacha-ring" />
              <div className="gacha-ring" />
              <div className="gacha-ring" />
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: "0.8s" }} />
                <div className="absolute inset-3 rounded-full border-4 border-primary/15 border-b-primary animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.6s" }} />
                <div className="absolute inset-6 rounded-full border-4 border-primary/10 border-l-primary animate-spin" style={{ animationDuration: "0.4s" }} />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-primary animate-pulse tracking-wide">
              Menarik kartu...
            </p>
            <p className="text-sm text-muted-foreground animate-pulse">Keberuntungan menentukan segalanya!</p>
          </div>
        )}

        {/* ── REVEAL ── */}
        {pullState === "reveal" && cards.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              {cards.map((card, idx) => {
                const rarity = RARITY_STYLES[card.rarity] || RARITY_STYLES.common;
                const isFlippable = idx === currentCardIndex && !flipped[idx];
                const isRevealed = flipped[idx];

                return (
                  <div
                    key={idx}
                    onClick={() => isFlippable && handleFlipCard(idx)}
                    className={cn(
                      "relative aspect-[2/3] card-3d transition-all duration-300",
                      isFlippable ? "cursor-pointer" : "cursor-default",
                      isRevealed ? "drop-shadow-lg" : "",
                    )}
                    style={isFlippable ? { filter: "drop-shadow(0 0 12px hsla(43,96%,58%,0.5))" } : {}}
                  >
                    <div className={cn("card-inner", isRevealed ? "is-flipped" : "")}>

                      {/* Front face — hidden side (card back) */}
                      <div className={cn(
                        "card-face border-2 flex items-center justify-center bg-secondary/60",
                        isFlippable ? "border-primary/60" : "border-border/50",
                        !isRevealed && !isFlippable ? "opacity-50" : "",
                      )}>
                        <div className="text-center">
                          <div className="w-12 h-16 rounded-lg border-2 border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 mx-auto flex items-center justify-center mb-2">
                            <Sparkles className={cn("w-6 h-6", isFlippable ? "text-primary animate-pulse" : "text-primary/30")} />
                          </div>
                          {isFlippable && (
                            <p className="text-xs text-primary font-bold animate-bounce">Tap!</p>
                          )}
                        </div>
                      </div>

                      {/* Back face — revealed card */}
                      <div className={cn(
                        "card-face card-face-back border-2 flex flex-col relative overflow-hidden",
                        rarity.border,
                        rarity.glow,
                        ["legendary","ultra_rare","super_rare"].includes(card.rarity) ? "card-shine" : "",
                      )}>
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge className={cn("text-[9px] px-1.5 border", rarity.badge)}>
                              {rarity.label}
                            </Badge>
                            {card.isNew && (
                              <Badge className="text-[9px] px-1.5 bg-primary/20 text-primary border-primary/50">
                                BARU
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
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
                <Button variant="ghost" onClick={handleRevealAll}>
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
