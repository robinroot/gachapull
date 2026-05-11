import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetCollection, useGetCollectionStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Wallet, Package, Loader2, AlertTriangle, MapPin, Phone, User, ScrollText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

const RARITY_LABEL: Record<string, string> = {
  legendary: "Legendary",
  ultra_rare: "Ultra Rare",
  super_rare: "Super Rare",
  rare: "Rare",
  common: "Common",
};

type CollectionEntry = {
  card: { id: number; name: string; rarity: string; imageUrl?: string | null; franchise?: string };
  count: number;
  firstObtainedAt: string;
  collectionId: number;
  buybackValue: number;
};

type BuybackDialogProps = {
  open: boolean;
  onClose: () => void;
  card: CollectionEntry["card"] | null;
  buybackValue: number;
  onSuccess: (coinsRefunded: number, newBalance: number, cardName: string) => void;
};

function BuybackDialog({ open, onClose, card, buybackValue, onSuccess }: BuybackDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSell = async () => {
    if (!card) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("gacha_token");
      const res = await fetch(`/api/collection/buyback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Buyback failed");
      onSuccess(data.amountRefunded, data.newBalance, data.cardName);
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Buyback gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Jual Kartu (Buyback)
          </DialogTitle>
          <DialogDescription>Tukarkan kartu ini menjadi saldo IDR</DialogDescription>
        </DialogHeader>

        {card && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/20">
              <img
                src={card.imageUrl || ""}
                alt={card.name}
                className="w-16 h-20 object-contain rounded"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x80/1a1a2e/FFD700?text=Card"; }}
              />
              <div>
                <p className="font-bold text-lg">{card.name}</p>
                <Badge className={cn("text-xs border mt-1", RARITY_BADGE[card.rarity] || RARITY_BADGE.common)}>
                  {RARITY_LABEL[card.rarity] || card.rarity}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Kamu akan mendapatkan</p>
              <p className="text-3xl font-display font-bold text-primary">{formatIdr(buybackValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">(80% dari nilai kartu)</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-300">
                Kartu akan <strong>dihapus dari koleksimu</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Batal
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                onClick={handleSell}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                Jual Sekarang
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const PROVINCES = [
  "Aceh", "Bali", "Banten", "Bengkulu", "DI Yogyakarta", "DKI Jakarta",
  "Gorontalo", "Jambi", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Kalimantan Barat",
  "Kalimantan Selatan", "Kalimantan Tengah", "Kalimantan Timur", "Kalimantan Utara",
  "Kepulauan Bangka Belitung", "Kepulauan Riau", "Lampung", "Maluku", "Maluku Utara",
  "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Papua", "Papua Barat", "Papua Barat Daya",
  "Papua Pegunungan", "Papua Selatan", "Papua Tengah", "Riau", "Sulawesi Barat",
  "Sulawesi Selatan", "Sulawesi Tengah", "Sulawesi Tenggara", "Sulawesi Utara",
  "Sumatera Barat", "Sumatera Selatan", "Sumatera Utara",
];

type PhysicalRequestDialogProps = {
  open: boolean;
  onClose: () => void;
  card: CollectionEntry["card"] | null;
};

function PhysicalRequestDialog({ open, onClose, card }: PhysicalRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", phone: "", address: "", city: "", province: "", postalCode: "", country: "Indonesia",
  });

  const setField = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !form.province) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("gacha_token");
      const res = await fetch(`/api/collection/request-physical`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      toast.success(`Permintaan kartu fisik "${card.name}" berhasil diajukan! Tim kami akan segera memprosesnya.`);
      onClose();
      setForm({ fullName: "", phone: "", address: "", city: "", province: "", postalCode: "", country: "Indonesia" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengajukan permintaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Request Kartu Fisik
          </DialogTitle>
          <DialogDescription>Isi alamat pengiriman dan kami akan mengirimkan kartu fisik ke rumahmu</DialogDescription>
        </DialogHeader>

        {card && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
              <img
                src={card.imageUrl || ""}
                alt={card.name}
                className="w-12 h-16 object-contain rounded"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x64/1a1a2e/FFD700?text=Card"; }}
              />
              <div>
                <p className="font-bold">{card.name}</p>
                <Badge className={cn("text-xs border mt-1", RARITY_BADGE[card.rarity] || RARITY_BADGE.common)}>
                  {RARITY_LABEL[card.rarity] || card.rarity}
                </Badge>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Penerima</p>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5" /> Nama Lengkap
              </Label>
              <Input id="fullName" placeholder="Nama sesuai identitas" value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5" /> Nomor HP / WA
              </Label>
              <Input id="phone" placeholder="08xxxxxxxxxx" value={form.phone}
                onChange={(e) => setField("phone", e.target.value)} required />
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alamat Pengiriman</p>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1.5 text-sm">
                <MapPin className="w-3.5 h-3.5" /> Alamat Lengkap
              </Label>
              <Input id="address" placeholder="Nama jalan, no rumah, RT/RW, kelurahan" value={form.address}
                onChange={(e) => setField("address", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm">Kota / Kabupaten</Label>
                <Input id="city" placeholder="Jakarta" value={form.city}
                  onChange={(e) => setField("city", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode" className="text-sm">Kode Pos</Label>
                <Input id="postalCode" placeholder="12345" value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="province" className="text-sm">Provinsi</Label>
              <Select value={form.province} onValueChange={(v) => setField("province", v)}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Pilih provinsi..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {PROVINCES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ScrollText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300">
                Kartu digital kamu <strong>tetap tersimpan</strong> di koleksi. Estimasi pengiriman 7-14 hari kerja setelah konfirmasi.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={loading || !form.province}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                Ajukan Permintaan
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CollectionPage() {
  useTitle("My Collection");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [franchise, setFranchise] = useState<string | undefined>(undefined);
  const [rarity, setRarity] = useState<string | undefined>(undefined);
  const [buybackCard, setBuybackCard] = useState<CollectionEntry | null>(null);
  const [physicalCard, setPhysicalCard] = useState<CollectionEntry["card"] | null>(null);

  const { data, isLoading, refetch } = useGetCollection({ franchise, rarity });
  const { data: stats } = useGetCollectionStats();

  const collection = (data || []) as unknown as CollectionEntry[];

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const handleBuybackSuccess = (coinsRefunded: number, _newBalance: number, cardName: string) => {
    toast.success(`Berhasil menjual ${cardName} dan mendapatkan ${formatIdr(coinsRefunded)}!`);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">My Collection</h1>
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { label: "Total Kartu", value: (stats as { totalCards?: number }).totalCards || 0 },
                { label: "Kartu Unik", value: (stats as { uniqueCards?: number }).uniqueCards || 0 },
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
              { label: "Semua", value: undefined },
              { label: "Pokemon", value: "pokemon" },
              { label: "One Piece", value: "onepiece" },
            ].map(({ label, value }) => (
              <Button key={label} size="sm"
                variant={franchise === value ? "default" : "outline"}
                onClick={() => setFranchise(value)}
                className={franchise === value ? "bg-primary text-primary-foreground" : ""}
              >{label}</Button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "Semua Rarity", value: undefined },
              { label: "Legendary", value: "legendary" },
              { label: "Ultra Rare", value: "ultra_rare" },
              { label: "Super Rare", value: "super_rare" },
              { label: "Rare", value: "rare" },
              { label: "Common", value: "common" },
            ].map(({ label, value }) => (
              <Button key={label} size="sm"
                variant={rarity === value ? "default" : "outline"}
                onClick={() => setRarity(value)}
                className={rarity === value ? "bg-primary text-primary-foreground" : ""}
              >{label}</Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : collection.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-display font-bold mb-2">Belum Ada Kartu</p>
            <p className="text-muted-foreground mb-6">Mulai pull pack untuk membangun koleksimu!</p>
            <Link href="/packs">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Browse Packs</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collection.map((item, idx) => {
              const cardRarity = item.card?.rarity || "common";
              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative rounded-xl border-2 bg-card overflow-hidden transition-all duration-300",
                    RARITY_STYLES[cardRarity] || "border-border"
                  )}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-secondary/30 relative">
                    <img
                      src={item.card?.imageUrl || ""}
                      alt={item.card?.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x150/1a1a2e/FFD700?text=Card"; }}
                    />
                    {item.count > 1 && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 font-bold bg-black/60 text-white border-0">
                        x{item.count}
                      </Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold truncate">{item.card?.name}</p>
                    <Badge className={cn("text-[9px] px-1.5 mt-1 border", RARITY_BADGE[cardRarity] || RARITY_BADGE.common)}>
                      {(RARITY_LABEL[cardRarity] || cardRarity).toUpperCase()}
                    </Badge>

                    <div className="mt-2 space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[10px] border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1"
                        onClick={() => setBuybackCard(item)}
                      >
                        <Wallet className="w-3 h-3" />
                        Jual ({formatIdr(item.buybackValue || 0)})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[10px] border-blue-500/40 text-blue-400 hover:bg-blue-500/10 flex items-center gap-1"
                        onClick={() => setPhysicalCard(item.card)}
                      >
                        <Package className="w-3 h-3" />
                        Request Fisik
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info section */}
        {collection.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-primary">Buyback — Nilai per Rarity</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Dapatkan <strong className="text-foreground">80% nilai kartu</strong> dalam bentuk saldo IDR saat kamu menjual kartu kembali.
              </p>
              <div className="grid grid-cols-5 gap-1.5 text-xs text-center">
                {[
                  { r: "Legendary", v: "40rb" }, { r: "Ultra Rare", v: "16rb" },
                  { r: "Super Rare", v: "6.4rb" }, { r: "Rare", v: "3.2rb" }, { r: "Common", v: "1.6rb" },
                ].map(({ r, v }) => (
                  <div key={r} className="p-1.5 rounded bg-secondary/30">
                    <p className="text-muted-foreground leading-tight">{r}</p>
                    <p className="font-bold text-primary mt-0.5">Rp {v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-display font-bold text-blue-400">Kartu Fisik — Dikirim ke Rumahmu</h3>
              </div>
              <p className="text-sm text-muted-foreground">Minta kami kirimkan kartu fisik ke alamatmu. Kartu digital tetap tersimpan.</p>
              <ul className="mt-3 text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Kartu digital tetap ada di koleksi</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Estimasi pengiriman 7–14 hari kerja</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Nomor resi akan diberikan setelah pengiriman</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <BuybackDialog
        open={!!buybackCard}
        onClose={() => setBuybackCard(null)}
        card={buybackCard?.card || null}
        buybackValue={buybackCard?.buybackValue || 0}
        onSuccess={handleBuybackSuccess}
      />
      <PhysicalRequestDialog
        open={!!physicalCard}
        onClose={() => setPhysicalCard(null)}
        card={physicalCard}
      />
    </Layout>
  );
}
