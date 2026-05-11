import { useState } from "react";
import {
  useListPacks, useCreatePack, useUpdatePack, useDeletePack,
  useGetPack, useListCards, useAddCardToPack, useRemoveCardFromPack,
} from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Wallet, Layers, X, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

type PackForm = {
  name: string;
  franchise: string;
  priceIdr: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
};

const defaultForm: PackForm = {
  name: "",
  franchise: "pokemon",
  priceIdr: "15000",
  imageUrl: "",
  description: "",
  isActive: true,
};

function ManageCardsSheet({ packId, packName, open, onClose }: {
  packId: number;
  packName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: pack, isLoading: packLoading, refetch: refetchPack } = useGetPack(packId);
  const { data: cardsData, isLoading: cardsLoading } = useListCards();
  const addCard = useAddCardToPack();
  const removeCard = useRemoveCardFromPack();

  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [probability, setProbability] = useState<string>("10");

  const cardPool = (pack as any)?.cardPool ?? [];
  const allCards = cardsData?.cards ?? [];
  const usedCardIds = new Set(cardPool.map((e: any) => e.card.id));
  const availableCards = allCards.filter((c) => !usedCardIds.has(c.id));

  const totalProbability = cardPool.reduce((sum: number, e: any) => sum + (parseFloat(e.probability) || 0), 0);

  const handleAdd = async () => {
    const cardId = parseInt(selectedCardId);
    const prob = parseFloat(probability);
    if (!cardId || isNaN(prob) || prob <= 0) {
      toast.error("Pilih kartu dan masukkan probabilitas yang valid");
      return;
    }
    if (totalProbability + prob > 100) {
      toast.error(`Total probabilitas melebihi 100% (saat ini ${totalProbability.toFixed(1)}%)`);
      return;
    }
    try {
      await addCard.mutateAsync({ packId, data: { cardId, probability: prob } });
      toast.success("Kartu ditambahkan");
      setSelectedCardId("");
      setProbability("10");
      refetchPack();
    } catch {
      toast.error("Gagal menambahkan kartu");
    }
  };

  const handleRemove = async (cardId: number, cardName: string) => {
    if (!confirm(`Hapus kartu "${cardName}" dari pack ini?`)) return;
    try {
      await removeCard.mutateAsync({ packId, data: { cardId } });
      toast.success("Kartu dihapus dari pack");
      refetchPack();
    } catch {
      toast.error("Gagal menghapus kartu");
    }
  };

  const rarityColor: Record<string, string> = {
    common: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    super_rare: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ultra_rare: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    legendary: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-card border-border">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-display">Kelola Kartu — {packName}</SheetTitle>
        </SheetHeader>

        {(packLoading || cardsLoading) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total probability indicator */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${totalProbability > 100 ? "bg-red-500/10 border-red-500/30 text-red-400" : totalProbability === 100 ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-secondary/50 border-border text-muted-foreground"}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Total probabilitas: <strong>{totalProbability.toFixed(1)}%</strong> dari 100% · {cardPool.length} kartu</span>
            </div>

            {/* Add card form */}
            <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
              <p className="text-sm font-semibold">Tambah Kartu</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Pilih Kartu</Label>
                  <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                    <SelectTrigger>
                      <SelectValue placeholder={availableCards.length === 0 ? "Semua kartu sudah ditambahkan" : "Pilih kartu..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {availableCards.map((card) => (
                        <SelectItem key={card.id} value={String(card.id)}>
                          <span className="flex items-center gap-2">
                            <span>{card.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">({card.rarity?.replace("_", " ")})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Probabilitas (%)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={probability}
                    onChange={(e) => setProbability(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={!selectedCardId || addCard.isPending || availableCards.length === 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addCard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Tambah ke Pack
              </Button>
            </div>

            {/* Cards already in pack */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Kartu dalam Pack</p>
              {cardPool.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  Belum ada kartu dalam pack ini
                </div>
              ) : (
                <div className="space-y-2">
                  {cardPool.map((entry: any) => (
                    <div key={entry.card.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-secondary/20 transition-colors">
                      <img
                        src={entry.card.imageUrl || ""}
                        alt={entry.card.name}
                        className="w-10 h-10 object-contain rounded shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/1a1a2e/FFD700?text=?"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.card.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-xs ${rarityColor[entry.card.rarity] || ""}`}>
                            {entry.card.rarity?.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{entry.card.franchise === "onepiece" ? "One Piece" : "Pokemon"}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-primary text-sm">{parseFloat(entry.probability).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">prob.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(entry.card.id, entry.card.name)}
                        disabled={removeCard.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function AdminPacks() {
  useTitle("Admin - Packs");
  const { data: packs, isLoading, refetch } = useListPacks();
  const createPack = useCreatePack();
  const updatePack = useUpdatePack();
  const deletePack = useDeletePack();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PackForm>(defaultForm);

  const [managePackId, setManagePackId] = useState<number | null>(null);
  const [managePackName, setManagePackName] = useState<string>("");

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (pack: any) => {
    setEditId(pack.id);
    setForm({
      name: pack.name,
      franchise: pack.franchise,
      priceIdr: String(pack.priceIdr || 15000),
      imageUrl: pack.imageUrl || "",
      description: pack.description || "",
      isActive: pack.isActive,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      franchise: form.franchise as "pokemon" | "onepiece",
      priceIdr: parseInt(form.priceIdr),
      imageUrl: form.imageUrl || null,
      description: form.description || null,
      isActive: form.isActive,
    };
    try {
      if (editId) {
        await updatePack.mutateAsync({ packId: editId, data: data as any });
        toast.success("Pack diupdate");
      } else {
        await createPack.mutateAsync({ data: data as any });
        toast.success("Pack dibuat");
      }
      setOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string; error?: string }; message?: string };
      toast.error(error?.data?.error || error?.data?.message || error?.message || "Gagal");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus pack "${name}"?`)) return;
    try {
      await deletePack.mutateAsync({ packId: id });
      toast.success("Pack dihapus");
      refetch();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Packs</h1>
          <p className="text-muted-foreground text-sm">{packs?.length || 0} pack total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Pack" : "Tambah Pack Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nama</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="Pokemon Base Set"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Franchise</Label>
                  <Select value={form.franchise} onValueChange={(v) => setForm((f) => ({ ...f, franchise: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pokemon">Pokemon</SelectItem>
                      <SelectItem value="onepiece">One Piece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.isActive ? "active" : "inactive"} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Harga (IDR)</Label>
                  <Input
                    type="number"
                    value={form.priceIdr}
                    onChange={(e) => setForm((f) => ({ ...f, priceIdr: e.target.value }))}
                    required
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>
              <ImageUpload
                label="Gambar Pack"
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi pack..."
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={createPack.isPending || updatePack.isPending}
              >
                {(createPack.isPending || updatePack.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editId ? "Update Pack" : "Buat Pack"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Pack</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Franchise</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Harga</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Kartu</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(packs || []).map((pack) => (
                <tr key={pack.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={(pack as any).imageUrl || ""}
                        alt={pack.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/32x32/1a1a2e/FFD700?text=?"; }}
                      />
                      <span className="font-medium">{pack.name}</span>
                    </div>
                  </td>
                  <td className="p-3 capitalize">{(pack as any).franchise === "onepiece" ? "One Piece" : "Pokemon"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-primary font-mono font-bold text-xs">
                      <Wallet className="w-3 h-3" />
                      {formatIdr((pack as any).priceIdr || 0)}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {(pack as any).cardCount ?? 0} kartu
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={pack.isActive ? "default" : "secondary"} className={pack.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                      {pack.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => { setManagePackId(pack.id); setManagePackName(pack.name); }}
                      >
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        Kartu
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(pack)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pack.id, pack.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {managePackId && (
        <ManageCardsSheet
          packId={managePackId}
          packName={managePackName}
          open={!!managePackId}
          onClose={() => { setManagePackId(null); refetch(); }}
        />
      )}
    </div>
  );
}
