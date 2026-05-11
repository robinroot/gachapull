import { useState } from "react";
import AdminLayout from "./layout";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Package, MapPin, Phone, User, Truck, CheckCircle, XCircle, Clock, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const RARITY_BADGE: Record<string, string> = {
  legendary: "bg-[hsla(0,84%,60%,0.15)] text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]",
  ultra_rare: "bg-[hsla(270,70%,60%,0.15)] text-[hsl(270,70%,60%)] border-[hsl(270,70%,60%)]",
  super_rare: "bg-[hsla(210,100%,60%,0.15)] text-[hsl(210,100%,60%)] border-[hsl(210,100%,60%)]",
  rare: "bg-[hsla(140,70%,50%,0.15)] text-[hsl(140,70%,50%)] border-[hsl(140,70%,50%)]",
  common: "bg-secondary text-muted-foreground border-border",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3.5 h-3.5" />, badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Diproses", icon: <Package className="w-3.5 h-3.5" />, badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  shipped: { label: "Dikirim", icon: <Truck className="w-3.5 h-3.5" />, badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  delivered: { label: "Terkirim", icon: <CheckCircle className="w-3.5 h-3.5" />, badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  cancelled: { label: "Dibatalkan", icon: <XCircle className="w-3.5 h-3.5" />, badge: "bg-red-500/15 text-red-400 border-red-500/30" },
};

type PhysicalRequest = {
  id: number;
  user: { id: number; username: string; email: string };
  card: { id: number; name: string; rarity: string; imageUrl?: string | null; franchise?: string };
  status: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  trackingNumber?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function UpdateDialog({
  open,
  onClose,
  request,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  request: PhysicalRequest | null;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(request?.status || "pending");
  const [trackingNumber, setTrackingNumber] = useState(request?.trackingNumber || "");
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("gacha_token");
      const res = await fetch(`/api/admin/physical-requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, trackingNumber: trackingNumber || undefined, adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Status permintaan berhasil diupdate");
      onUpdated();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Update gagal");
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">Update Request #{request.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
            <img
              src={request.card.imageUrl || ""}
              alt={request.card.name}
              className="w-10 h-14 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x56/1a1a2e/FFD700?text=Card"; }}
            />
            <div>
              <p className="font-bold text-sm">{request.card.name}</p>
              <p className="text-xs text-muted-foreground">{request.user.username} ({request.user.email})</p>
              <p className="text-xs text-muted-foreground">{request.city}, {request.province}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-secondary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tracking">Nomor Resi / Tracking</Label>
            <Input
              id="tracking"
              placeholder="JNE123456789, SiCepat..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan Admin</Label>
            <Input
              id="notes"
              placeholder="Catatan untuk customer (opsional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Batal</Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPhysicalRequests() {
  useTitle("Admin - Physical Card Requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PhysicalRequest | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/physical-requests", statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem("gacha_token");
      const url = statusFilter === "all" ? "/api/admin/physical-requests" : `/api/admin/physical-requests?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const requests: PhysicalRequest[] = (data as { requests?: PhysicalRequest[] })?.requests || [];

  const handleUpdated = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/physical-requests"] });
  };

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Physical Card Requests</h1>
        <p className="text-muted-foreground mt-1">Kelola permintaan pengiriman kartu fisik dari pengguna</p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium", cfg.badge)}>
            {cfg.icon} {cfg.label}: {statusCounts[key] || 0}
          </div>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card border-border">
            <SelectValue placeholder="Filter status..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>
                <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">{requests.length} permintaan</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold">Belum ada permintaan</p>
          <p className="text-sm text-muted-foreground">Permintaan kartu fisik dari pengguna akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={req.card.imageUrl || ""}
                    alt={req.card.name}
                    className="w-10 h-14 object-contain rounded shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x56/1a1a2e/FFD700?text=Card"; }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{req.card.name}</span>
                      <Badge className={cn("text-[10px] px-1.5 border", RARITY_BADGE[req.card.rarity] || RARITY_BADGE.common)}>
                        {req.card.rarity.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge className={cn("text-[10px] px-1.5 border flex items-center gap-1", cfg.badge)}>
                        {cfg.icon} {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.user.username}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{req.city}, {req.province}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{req.phone}</span>
                    </div>
                    {req.trackingNumber && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Resi: {req.trackingNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {new Date(req.createdAt).toLocaleDateString("id-ID")}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1.5"
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 bg-secondary/10 text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div><span className="text-muted-foreground">Nama Penerima:</span> <strong>{req.fullName}</strong></div>
                      <div><span className="text-muted-foreground">No HP:</span> <strong>{req.phone}</strong></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Alamat:</span> <strong>{req.address}, {req.city}, {req.province} {req.postalCode}, {req.country}</strong></div>
                      <div><span className="text-muted-foreground">Tanggal Ajukan:</span> {new Date(req.createdAt).toLocaleString("id-ID")}</div>
                      <div><span className="text-muted-foreground">Terakhir Update:</span> {new Date(req.updatedAt).toLocaleString("id-ID")}</div>
                      {req.trackingNumber && <div className="col-span-2"><span className="text-muted-foreground">No. Resi:</span> <strong className="text-primary">{req.trackingNumber}</strong></div>}
                      {req.adminNotes && <div className="col-span-2"><span className="text-muted-foreground">Catatan:</span> {req.adminNotes}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <UpdateDialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onUpdated={handleUpdated}
      />
    </AdminLayout>
  );
}
