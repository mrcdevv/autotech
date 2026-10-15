import React, { createContext, useContext, useState, useEffect } from "react";
import type { LoginResponse } from "../types";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse, remember?: boolean) => void;
  logout: () => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredAuth(): { user: UserInfo | null; token: string | null } {
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
  const storedUser = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  return { user: storedUser ? JSON.parse(storedUser) : null, token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { user: storedUser, token } = readStoredAuth();
    setUser(storedUser && token ? storedUser : null);
    setIsLoading(false);
  }, []);

  const login = (data: LoginResponse, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem("token");
    other.removeItem("user");

    const userInfo: UserInfo = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      mustChangePassword: data.mustChangePassword,
    };
    storage.setItem("token", data.accessToken);
    storage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const clearMustChangePassword = () => {
    if (!user) return;
    const updated = { ...user, mustChangePassword: false };
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, clearMustChangePassword }}
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
