import { useState } from "react";
import { useListCards, useCreateCard, useUpdateCard, useDeleteCard } from "@workspace/api-client-react";
import { useTitle } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";

const RARITIES = ["common", "rare", "super_rare", "ultra_rare", "legendary"];
const FRANCHISES = ["pokemon", "onepiece"];

const RARITY_BADGE: Record<string, string> = {
  legendary: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",
  ultra_rare: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]",
  super_rare: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]",
  rare: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",
  common: "bg-secondary text-muted-foreground border-border",
};

type CardForm = {
  name: string;
  franchise: string;
  rarity: string;
  imageUrl: string;
  description: string;
  baseDropRate: string;
};

const defaultForm: CardForm = {
  name: "",
  franchise: "pokemon",
  rarity: "common",
  imageUrl: "",
  description: "",
  baseDropRate: "0.05",
};

export default function AdminCards() {
  useTitle("Admin - Cards");
  const { data: cardsData, isLoading, refetch } = useListCards();
  type CardItem = { id: number; name: string; franchise: string; rarity: string; imageUrl?: string | null; description?: string | null; baseDropRate?: number | null; pullCount?: number; createdAt?: string };
  const cards: CardItem[] = ((cardsData as unknown as { cards?: CardItem[] })?.cards) || [];
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CardForm>(defaultForm);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (card: { id: number; name: string; franchise: string; rarity: string; imageUrl?: string | null; description?: string | null; baseDropRate?: number | null }) => {
    setEditId(card.id);
    setForm({
      name: card.name,
      franchise: card.franchise,
      rarity: card.rarity,
      imageUrl: card.imageUrl || "",
      description: card.description || "",
      baseDropRate: String(card.baseDropRate || 0.05),
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      franchise: form.franchise as "pokemon" | "onepiece",
      rarity: form.rarity as "common" | "rare" | "super_rare" | "ultra_rare" | "legendary",
      imageUrl: form.imageUrl || null,
      description: form.description || null,
      baseDropRate: parseFloat(form.baseDropRate),
    };
    try {
      if (editId) {
        await updateCard.mutateAsync({ cardId: editId, data });
        toast.success("Card updated");
      } else {
        await createCard.mutateAsync({ data });
        toast.success("Card created");
      }
      setOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Failed");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete card "${name}"?`)) return;
    try {
      await deleteCard.mutateAsync({ cardId: id });
      toast.success("Card deleted");
      refetch();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Cards</h1>
          <p className="text-muted-foreground text-sm">{cards?.length || 0} cards total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Card" : "Add New Card"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="Pikachu"
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
                  <Label>Rarity</Label>
                  <Select value={form.rarity} onValueChange={(v) => setForm((f) => ({ ...f, rarity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RARITIES.map((r) => (
                        <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Base Drop Rate</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={form.baseDropRate}
                    onChange={(e) => setForm((f) => ({ ...f, baseDropRate: e.target.value }))}
                    placeholder="0.05"
                  />
                </div>
              </div>
              <ImageUpload
                label="Gambar Kartu"
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Card description..."
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={createCard.isPending || updateCard.isPending}
              >
                {createCard.isPending || updateCard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Card" : "Create Card"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Card</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Franchise</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Rarity</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Drop Rate</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(cards || []).map((card) => (
                <tr key={card.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={card.imageUrl || ""}
                        alt={card.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/32x32/1a1a2e/FFD700?text=?"; }}
                      />
                      <span className="font-medium">{card.name}</span>
                    </div>
                  </td>
                  <td className="p-3 capitalize">{card.franchise === "onepiece" ? "One Piece" : "Pokemon"}</td>
                  <td className="p-3">
                    <Badge className={cn("text-xs border", RARITY_BADGE[card.rarity] || RARITY_BADGE.common)}>
                      {card.rarity?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">{(Number(card.baseDropRate || 0) * 100).toFixed(2)}%</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(card)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(card.id, card.name)}>
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
    </div>
  );
}
