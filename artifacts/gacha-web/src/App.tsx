import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import PacksPage from "@/pages/packs";
import PackDetailPage from "@/pages/pack-detail";
import GachaPage from "@/pages/gacha";
import DashboardPage from "@/pages/dashboard";
import CollectionPage from "@/pages/collection";
import LeaderboardPage from "@/pages/leaderboard";
import WalletPage from "@/pages/wallet";
import HistoryPage from "@/pages/history";
import MyRequestsPage from "@/pages/my-requests";
import AdminLayout from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCards from "@/pages/admin/cards";
import AdminPacks from "@/pages/admin/packs";
import AdminUsers from "@/pages/admin/users";
import AdminTransactions from "@/pages/admin/transactions";
import AdminSettings from "@/pages/admin/settings";
import AdminPhysicalRequests from "@/pages/admin/physical-requests";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/packs" component={PacksPage} />
      <Route path="/packs/:id" component={PackDetailPage} />
      <Route path="/gacha/:packId" component={GachaPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/collection" component={CollectionPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/my-requests" component={MyRequestsPage} />
      <Route path="/admin">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/cards">
        <AdminLayout>
          <AdminCards />
        </AdminLayout>
      </Route>
      <Route path="/admin/packs">
        <AdminLayout>
          <AdminPacks />
        </AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      </Route>
      <Route path="/admin/transactions">
        <AdminLayout>
          <AdminTransactions />
        </AdminLayout>
      </Route>
      <Route path="/admin/physical-requests">
        <AdminLayout>
          <AdminPhysicalRequests />
        </AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
