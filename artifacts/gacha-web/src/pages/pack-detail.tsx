import { Link, useParams } from "wouter";
import { useGetPack } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Zap, ArrowLeft } from "lucide-react";

export default function PackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const packId = Number(id);
  const { data: pack, isLoading } = useGetPack(packId);
  const { isAuthenticated } = useAuth();
  useTitle(pack?.name || "Pack Detail");

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!pack) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="text-muted-foreground">Pack tidak ditemukan.</p>
          <Link href="/packs"><Button variant="ghost" className="mt-4">← Kembali ke Packs</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link href="/packs">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Packs
          </Button>
        </Link>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="relative">
            <div className="bg-secondary/30 flex items-center justify-center p-16">
              <img
                src={pack.imageUrl || ""}
                alt={pack.name}
                className="h-48 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/FFD700?text=Pack"; }}
              />
            </div>
          </div>
          <div className="p-8">
            <Badge variant="secondary" className="mb-3 capitalize">
              {(pack as any).franchise === "onepiece" ? "One Piece" : "Pokemon"}
            </Badge>
            <h1 className="text-3xl font-display font-bold mb-2">{pack.name}</h1>
            <p className="text-muted-foreground mb-6">{pack.description}</p>
            <div className="flex items-center gap-6 mb-8 p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Harga</p>
                <div className="flex items-center gap-1.5 text-primary font-mono font-bold text-2xl">
                  <Wallet className="w-6 h-6" />
                  {formatIdr((pack as any).priceIdr || 0)}
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Kartu</p>
                <p className="text-xl font-bold">{(pack as any).cardCount || "—"}</p>
              </div>
            </div>
            {isAuthenticated ? (
              <Link href={`/gacha/${pack.id}`}>
                <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsla(43,96%,58%,0.4)]">
                  <Zap className="w-5 h-5 mr-2" />
                  Pull Pack Ini
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full font-bold">
                  Login untuk Pull
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
