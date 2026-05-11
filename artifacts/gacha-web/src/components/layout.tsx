import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Wallet, User, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { formatIdr } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/packs",       label: "Packs"      },
  { href: "/leaderboard", label: "Leaderboard" },
];

const NAV_LINKS_AUTH = [
  { href: "/collection", label: "Koleksi" },
  { href: "/history",    label: "History"  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
      logout();
      setLocation("/");
      toast.success("Berhasil keluar");
    } catch {
      toast.error("Gagal keluar");
    }
  };

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-float" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tighter text-primary group-hover:drop-shadow-[0_0_12px_hsla(43,96%,58%,0.8)] transition-all duration-300">
                GachaPull
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {[...NAV_LINKS, ...(user ? NAV_LINKS_AUTH : [])].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative px-3 py-1.5 rounded-lg transition-all duration-200",
                    isActive(href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {label}
                  {isActive(href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Balance chip */}
                <Link href="/wallet">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-primary/40 hover:shadow-[0_0_12px_hsla(43,96%,58%,0.2)] transition-all duration-200 cursor-pointer">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono font-bold text-primary text-sm">{formatIdr((user as any).balanceIdr || 0)}</span>
                  </div>
                </Link>

                {/* Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/40 transition-all">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                        <AvatarFallback className="bg-secondary text-primary font-bold text-xs">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8 border border-primary/20">
                        <AvatarFallback className="bg-secondary text-primary font-bold text-xs">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="w-[160px] truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard" className="w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/wallet" className="w-full flex items-center">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Saldo & Top-up</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/admin" className="w-full flex items-center text-primary">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2">
                  Masuk
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold hover:shadow-[0_0_16px_hsla(43,96%,58%,0.4)] transition-shadow">
                    Mulai Pull
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/50 py-8 md:py-12 bg-background/80 mt-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-display font-bold text-xl text-primary">GachaPull</span>
            <p className="text-sm text-muted-foreground">Koleksi kartu digital premium.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">Syarat & Ketentuan</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
