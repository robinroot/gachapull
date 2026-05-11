import { useState } from "react";
import { useListAdminUsers, useUpdateAdminUser } from "@workspace/api-client-react";
import { useTitle, formatIdr } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Wallet, ShieldAlert } from "lucide-react";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  balanceIdr: number;
  totalSpent: number;
  totalPulls: number;
  createdAt?: string;
};

export default function AdminUsers() {
  useTitle("Admin - Users");
  const { data, isLoading, refetch } = useListAdminUsers();
  const updateUser = useUpdateAdminUser();
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState("user");

  const users = (data as unknown as { users?: AdminUser[] })?.users || [];

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        data: { role: newRole as "user" | "admin" },
      });
      toast.success(`${selectedUser.username} diupdate ke role ${newRole}`);
      setSelectedUser(null);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error?.data?.message || error?.message || "Gagal");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Users</h1>
        <p className="text-muted-foreground text-sm">{users.length} pengguna</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Saldo</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Total Spent</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Bergabung</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={user.role === "admin" ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-border"}>
                      {user.role === "admin" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-primary font-mono text-xs font-bold">
                      <Wallet className="w-3 h-3" />
                      {formatIdr(user.balanceIdr || 0)}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {formatIdr(user.totalSpent || 0)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setSelectedUser({ id: user.id, username: user.username, role: user.role }); setNewRole(user.role); }}
                    >
                      Edit Role
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={(v) => !v && setSelectedUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateRole} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" disabled={updateUser.isPending}>
              Update Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
