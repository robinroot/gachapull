import { useGetLeaderboard } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  user: { id: number; username: string; avatarUrl: string | null };
  totalSpentIdr: number;
  totalPulls: number;
  topCard?: { name: string; rarity: string; imageUrl?: string | null } | null;
};

export default function LeaderboardPage() {
  useTitle("Leaderboard");
  const { data, isLoading } = useGetLeaderboard();
  const leaderboard = (data || []) as unknown as LeaderboardEntry[];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-mono text-sm text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "border-yellow-400/50 bg-yellow-400/5";
    if (rank === 2) return "border-gray-300/50 bg-gray-300/5";
    if (rank === 3) return "border-amber-600/50 bg-amber-600/5";
    return "border-border";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Top kolektor berdasarkan total pengeluaran</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Belum ada ranking. Jadilah kolektor pertama!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const rank = entry.rank;
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01]",
                    getRankStyle(rank)
                  )}
                >
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {entry.user.username.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{entry.user.username}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{entry.totalPulls || 0} pulls</span>
                      {entry.topCard && (
                        <span className="truncate">Top: {entry.topCard.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-primary text-lg">
                      {formatIdr(Number(entry.totalSpentIdr || 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">total spent</div>
                  </div>

                  {rank <= 3 && (
                    <Badge
                      className={cn(
                        "shrink-0 font-bold",
                        rank === 1 ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/50" :
                        rank === 2 ? "bg-gray-300/20 text-gray-300 border-gray-300/50" :
                        "bg-amber-600/20 text-amber-600 border-amber-600/50"
                      )}
                    >
                      #{rank}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
