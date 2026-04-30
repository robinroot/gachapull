import { useState } from "react";
import { useListAdminCoinPackages, useCreateAdminCoinPackage, useUpdateAdminCoinPackage, useDeleteAdminCoinPackage } from "@workspace/api-client-react";
import { useTitle, formatCoins, formatUsd } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Coins } from "lucide-react";

type PkgForm = {
  name: string;
  coins: string;
  bonusCoins: string;
  priceUsd: string;
  isActive: boolean;
};

const defaultForm: PkgForm = { name: "", coins: "100", bonusCoins: "0", priceUsd: "0.99", isActive: true };

export default function AdminCoinPackages() {
  useTitle("Admin - Coin Packages");
  const { data: packages, isLoading, refetch } = useListAdminCoinPackages();
  const createPkg = useCreateAdminCoinPackage();
  const updatePkg = useUpdateAdminCoinPackage();
  const deletePkg = useDeleteAdminCoinPackage();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PkgForm>(defaultForm);

  const openCreate = () => { setEditId(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (pkg: { id: number; name: string; coins: number; bonusCoins?: number | null; priceUsd: number; isActive: boolean }) => {
    setEditId(pkg.id);
    setForm({
      name: pkg.name,
      coins: String(pkg.coins),
      bonusCoins: String(pkg.bonusCoins || 0),
      priceUsd: String(pkg.priceUsd),
      isActive: pkg.isActive,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      coins: parseInt(form.coins),
      bonusCoins: parseInt(form.bonusCoins) || 0,
      priceUsd: parseFloat(form.priceUsd),
      isActive: form.isActive,
    };
    try {
      if (editId) {
        await updatePkg.mutateAsync({ packageId: editId, data });
        toast.success("Package updated");
      } else {
        await createPkg.mutateAsync({ data });
        toast.success("Package created");
      }
      setOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Failed");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete package "${name}"?`)) return;
    try {
      await deletePkg.mutateAsync({ packageId: id });
      toast.success("Package deleted");
      refetch();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Coin Packages</h1>
          <p className="text-muted-foreground text-sm">Manage purchaseable coin bundles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Package" : "Add Coin Package"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Package Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Starter Pack" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Coins</Label>
                  <Input type="number" value={form.coins} onChange={(e) => setForm((f) => ({ ...f, coins: e.target.value }))} required min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Coins</Label>
                  <Input type="number" value={form.bonusCoins} onChange={(e) => setForm((f) => ({ ...f, bonusCoins: e.target.value }))} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input type="number" step="0.01" value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))} required min="0" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" disabled={createPkg.isPending || updatePkg.isPending}>
                {createPkg.isPending || updatePkg.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Package" : "Create Package"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(packages || []).map((pkg) => (
            <div key={pkg.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{pkg.name}</h3>
                  {pkg.bonusCoins > 0 && (
                    <Badge className="bg-primary/20 text-primary border-primary/50 text-xs mt-1">
                      +{pkg.bonusCoins} Bonus
                    </Badge>
                  )}
                </div>
                <Badge variant={pkg.isActive ? "default" : "secondary"} className={pkg.isActive ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" : "text-xs"}>
                  {pkg.isActive ? "Active" : "Off"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-2xl font-display font-bold text-primary">
                  {formatCoins(pkg.coins + (pkg.bonusCoins || 0))}
                </span>
              </div>
              <p className="text-lg font-bold mb-4">{formatUsd(Number(pkg.priceUsd))}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(pkg)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pkg.id, pkg.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
