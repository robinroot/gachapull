import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Coins, User, LogOut, ShieldAlert } from "lucide-react";
import { formatCoins } from "@/lib/helpers";
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

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
      logout();
      setLocation("/");
      toast.success("Logged out successfully");
    } catch (e) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl tracking-tighter text-primary">GachaPull</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/packs" className="hover:text-primary transition-colors">Packs</Link>
              <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
              {user && (
                <>
                  <Link href="/collection" className="hover:text-primary transition-colors">Collection</Link>
                  <Link href="/history" className="hover:text-primary transition-colors">History</Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/wallet">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors cursor-pointer">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-primary">{formatCoins(user.coinsBalance || 0)}</span>
                  </div>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 border border-primary/20">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                        <AvatarFallback className="bg-secondary text-primary">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
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
                        <Coins className="mr-2 h-4 w-4" />
                        <span>Wallet & Buy Coins</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
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
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    Start Pulling
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border py-8 md:py-12 bg-background mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-display font-bold text-xl text-primary">GachaPull</span>
            <p className="text-sm text-muted-foreground">Premium digital card collecting experience.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
