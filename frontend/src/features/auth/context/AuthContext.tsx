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
  login: (data: LoginResponse) => void;
  logout: () => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = (data: LoginResponse) => {
    localStorage.setItem("token", data.accessToken);
    const userInfo: UserInfo = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      mustChangePassword: data.mustChangePassword,
    };
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const clearMustChangePassword = () => {
    if (!user) return;
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem("user", JSON.stringify(updated));
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
