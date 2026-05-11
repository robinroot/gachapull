import { useListAdminTransactions } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

type AdminTx = {
  id: number;
  user: { id: number; username: string };
  method: string;
  amountIdr: number;
  status: string;
  paymentRef?: string | null;
  createdAt: string;
};

export default function AdminTransactions() {
  useTitle("Admin - Transaksi");
  const { data, isLoading } = useListAdminTransactions();
  const transactions = (data as unknown as { transactions?: AdminTx[] })?.transactions || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold">Transaksi Top-up</h1>
          <p className="text-muted-foreground text-sm">{transactions.length} transaksi</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Belum ada transaksi.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Metode</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Nominal</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="p-3 font-mono text-xs text-muted-foreground">#{tx.id}</td>
                  <td className="p-3 font-medium">{tx.user?.username || `User #${tx.user?.id}`}</td>
                  <td className="p-3 uppercase">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {tx.method}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono font-bold text-primary">{formatIdr(Number(tx.amountIdr || 0))}</td>
                  <td className="p-3">
                    <Badge className={`text-xs border ${STATUS_BADGE[tx.status] || STATUS_BADGE.pending}`}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID") : "—"}
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
