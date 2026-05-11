import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, Phone, User, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type PhysicalRequest = {
  id: number;
  card: { id: number; name: string; rarity: string; imageUrl?: string | null; franchise?: string };
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  trackingNumber: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_CONFIG: Record<PhysicalRequest["status"], { label: string; color: string; icon: typeof Clock; bg: string }> = {
  pending:    { label: "Menunggu",    color: "text-yellow-400",  icon: Clock,        bg: "bg-yellow-500/10 border-yellow-500/30" },
  processing: { label: "Diproses",   color: "text-blue-400",    icon: Package,      bg: "bg-blue-500/10 border-blue-500/30" },
  shipped:    { label: "Dikirim",    color: "text-purple-400",  icon: Truck,        bg: "bg-purple-500/10 border-purple-500/30" },
  delivered:  { label: "Terkirim",   color: "text-green-400",   icon: CheckCircle2, bg: "bg-green-500/10 border-green-500/30" },
  cancelled:  { label: "Dibatalkan", color: "text-red-400",     icon: XCircle,      bg: "bg-red-500/10 border-red-500/30" },
};

const RARITY_STYLES: Record<string, string> = {
  legendary: "border-[hsl(0,84%,60%)] shadow-[0_0_12px_hsla(0,84%,60%,0.3)]",
  ultra_rare: "border-[hsl(270,70%,60%)]",
  super_rare: "border-[hsl(210,100%,60%)]",
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

export default function MyRequestsPage() {
  useTitle("Permintaan Kartu Fisik");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<PhysicalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => localStorage.getItem("gacha_token") || "";

  useEffect(() => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    fetchRequests();
  }, [isAuthenticated]);

  async function fetchRequests() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/collection/physical-requests", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setRequests(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold">Pengiriman Kartu Fisik</h1>
          <p className="text-muted-foreground mt-1">Status dan resi pengiriman kartu fisikmu</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-display font-bold">Belum ada permintaan</p>
              <p className="text-muted-foreground text-sm mt-1">
                Kamu belum pernah request pengiriman kartu fisik.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const rarity = req.card.rarity || "common";

              return (
                <Card key={req.id} className={cn("bg-card border overflow-hidden", RARITY_STYLES[rarity] || "border-border")}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Card image */}
                      <div className="shrink-0">
                        <div className={cn("w-20 h-20 rounded-xl border-2 bg-secondary/50 overflow-hidden", RARITY_STYLES[rarity] || "border-border")}>
                          <img
                            src={req.card.imageUrl || ""}
                            alt={req.card.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/1a1a2e/FFD700?text=Card"; }}
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-display font-bold text-base truncate">{req.card.name}</p>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 mt-0.5", RARITY_BADGE[rarity])}>
                              {rarity.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0", statusCfg.bg, statusCfg.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusCfg.label}
                          </div>
                        </div>

                        {/* Tracking number */}
                        {req.trackingNumber && (
                          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                            <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">No. Resi</p>
                              <p className="font-mono font-bold text-sm text-primary">{req.trackingNumber}</p>
                            </div>
                          </div>
                        )}

                        {/* Admin notes */}
                        {req.adminNotes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Catatan: {req.adminNotes}
                          </p>
                        )}

                        {/* Address summary */}
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{req.fullName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{req.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{req.address}, {req.city}, {req.province} {req.postalCode}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-2">
                          Diminta: {new Date(req.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          {req.updatedAt !== req.createdAt && (
                            <> · Diperbarui: {new Date(req.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
