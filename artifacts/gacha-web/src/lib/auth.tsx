import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, UserProfile } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("gacha_token"));

  const { data: user, isLoading: isUserLoading, isFetching: isUserFetching, refetch, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: 1,
      staleTime: 2 * 60 * 1000,
    },
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("gacha_token", token);
    } else {
      localStorage.removeItem("gacha_token");
    }
  }, [token]);

  // Only logout on explicit 401 — not transient network errors
  useEffect(() => {
    if (error) {
      const status = (error as any)?.status ?? (error as any)?.response?.status;
      if (status === 401) {
        setToken(null);
      }
    }
  }, [error]);

  const login = (newToken: string) => {
    localStorage.setItem("gacha_token", newToken);
    setToken(newToken);
    refetch();
  };

  const logout = () => {
    setToken(null);
  };

  const isLoading = (isUserLoading || isUserFetching) && !!token;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        logout,
        // Optimistic auth: jika token ada dan masih loading, anggap sudah login
        // agar tidak redirect ke /login saat page refresh
        isAuthenticated: !!user || (!!token && isLoading),
        refetchUser: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
