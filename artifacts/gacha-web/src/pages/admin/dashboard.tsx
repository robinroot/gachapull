import { useGetAdminStats } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, CreditCard, Wallet, Star, TrendingUp } from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalCards: number;
  totalPacks: number;
  totalPulls: number;
  totalRevenueIdr: number;
  revenueByMethod: { qris?: number; gopay?: number; ovo?: number; dana?: number; bank_transfer?: number };
  recentTransactions: Array<{
    id: number;
    user: { id: number; username: string };
    method: string;
    amountIdr: number;
    status: string;
    createdAt: string;
  }>;
};

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminDashboard() {
  useTitle("Admin Dashboard");
  const { data, isLoading } = useGetAdminStats();
  const stats = data as unknown as AdminStats | undefined;

  const statCards = stats
    ? [
        { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
        { icon: Star, label: "Total Cards", value: stats.totalCards, color: "text-purple-400" },
        { icon: Package, label: "Total Packs", value: stats.totalPacks, color: "text-yellow-400" },
        { icon: CreditCard, label: "Total Pulls", value: stats.totalPulls, color: "text-green-400" },
        { icon: Wallet, label: "Total Revenue", value: formatIdr(Number(stats.totalRevenueIdr || 0)), color: "text-primary" },
        { icon: TrendingUp, label: "QRIS Revenue", value: formatIdr(Number(stats.revenueByMethod?.qris || 0)), color: "text-orange-400" },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview platform</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {statCards.map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="bg-card border-border">
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-5">
                  <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
            <div>
              <h2 className="text-xl font-display font-bold mb-4">Transaksi Terbaru</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Metode</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Nominal</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-secondary/10">
                        <td className="p-3 font-medium">{tx.user?.username}</td>
                        <td className="p-3 capitalize text-xs uppercase font-mono">{tx.method}</td>
                        <td className="p-3 font-mono font-bold text-primary">{formatIdr(tx.amountIdr)}</td>
                        <td className="p-3">
                          <Badge className={`text-xs border ${STATUS_BADGE[tx.status] || STATUS_BADGE.pending}`}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
