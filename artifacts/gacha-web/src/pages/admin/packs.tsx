import { useState } from "react";
import { useListPacks, useCreatePack, useUpdatePack, useDeletePack } from "@workspace/api-client-react";
import { useTitle, formatCoins } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Coins } from "lucide-react";

type PackForm = {
  name: string;
  franchise: string;
  priceCoins: string;
  priceUsd: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
};

const defaultForm: PackForm = {
  name: "",
  franchise: "pokemon",
  priceCoins: "100",
  priceUsd: "4.99",
  imageUrl: "",
  description: "",
  isActive: true,
};

export default function AdminPacks() {
  useTitle("Admin - Packs");
  const { data: packs, isLoading, refetch } = useListPacks();
  const createPack = useCreatePack();
  const updatePack = useUpdatePack();
  const deletePack = useDeletePack();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PackForm>(defaultForm);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (pack: { id: number; name: string; franchise: string; priceCoins: number; priceUsd: number; imageUrl?: string | null; description?: string | null; isActive: boolean }) => {
    setEditId(pack.id);
    setForm({
      name: pack.name,
      franchise: pack.franchise,
      priceCoins: String(pack.priceCoins),
      priceUsd: String(pack.priceUsd),
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
      priceCoins: parseInt(form.priceCoins),
      priceUsd: parseFloat(form.priceUsd),
      imageUrl: form.imageUrl || null,
      description: form.description || null,
      isActive: form.isActive,
    };
    try {
      if (editId) {
        await updatePack.mutateAsync({ packId: editId, data });
        toast.success("Pack updated");
      } else {
        await createPack.mutateAsync({ data });
        toast.success("Pack created");
      }
      setOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Failed");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete pack "${name}"?`)) return;
    try {
      await deletePack.mutateAsync({ packId: id });
      toast.success("Pack deleted");
      refetch();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Packs</h1>
          <p className="text-muted-foreground text-sm">{packs?.length || 0} packs total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Pack" : "Add New Pack"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Name</Label>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (Coins)</Label>
                  <Input
                    type="number"
                    value={form.priceCoins}
                    onChange={(e) => setForm((f) => ({ ...f, priceCoins: e.target.value }))}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.priceUsd}
                    onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Pack description..."
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={createPack.isPending || updatePack.isPending}
              >
                {createPack.isPending || updatePack.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Pack" : "Create Pack"}
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
                <th className="text-left p-3 text-muted-foreground font-medium">Price</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(packs || []).map((pack) => (
                <tr key={pack.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={pack.imageUrl || ""}
                        alt={pack.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/32x32/1a1a2e/FFD700?text=?"; }}
                      />
                      <span className="font-medium">{pack.name}</span>
                    </div>
                  </td>
                  <td className="p-3 capitalize">{pack.franchise === "onepiece" ? "One Piece" : "Pokemon"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-primary font-mono font-bold text-xs">
                      <Coins className="w-3 h-3" />
                      {formatCoins(pack.priceCoins)}
                    </div>
                    <span className="text-xs text-muted-foreground">${pack.priceUsd}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant={pack.isActive ? "default" : "secondary"} className={pack.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                      {pack.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}
