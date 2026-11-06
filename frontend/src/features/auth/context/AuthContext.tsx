import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";
import type { PermissionCode } from "../permissions";
import type { CurrentUserResponse, LoginResponse } from "../types";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse, remember?: boolean) => void;
  logout: () => void;
  clearMustChangePassword: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): UserInfo | null {
  const storedUser = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
  if (!storedUser || !token) return null;
  const parsed = JSON.parse(storedUser) as Partial<UserInfo>;
  // Sessions stored before permissions existed have no roles/permissions yet;
  // they are filled in by the /auth/me refresh below.
  return {
    email: parsed.email ?? "",
    firstName: parsed.firstName ?? "",
    lastName: parsed.lastName ?? "",
    mustChangePassword: parsed.mustChangePassword ?? false,
    roles: parsed.roles ?? [],
    permissions: parsed.permissions ?? [],
  };
}

function toUserInfo(data: LoginResponse | CurrentUserResponse): UserInfo {
  return {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    mustChangePassword: data.mustChangePassword,
    roles: data.roles ?? [],
    permissions: data.permissions ?? [],
  };
}

function activeStorage(): Storage {
  return localStorage.getItem("token") ? localStorage : sessionStorage;
}

function persistUser(userInfo: UserInfo) {
  activeStorage().setItem("user", JSON.stringify(userInfo));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeUser = (userInfo: UserInfo) => {
    persistUser(userInfo);
    setUser(userInfo);
  };

  useEffect(() => {
    const storedUser = readStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }
    // Roles may have changed since the last login: refresh them from the server.
    authApi
      .me()
      .then((res) => {
        const refreshed = toUserInfo(res.data.data);
        persistUser(refreshed);
        setUser(refreshed);
      })
      .catch(() => {
        // 401 is handled globally by the API client (redirects to /login).
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (data: LoginResponse, remember = true) => {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem("token");
    other.removeItem("user");
    target.setItem("token", data.accessToken);
    storeUser(toUserInfo(data));
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
    storeUser({ ...user, mustChangePassword: false });
  };

  const hasPermission = useCallback(
    (permission: PermissionCode) => user?.permissions.includes(permission) ?? false,
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: PermissionCode[]) => permissions.some((permission) => hasPermission(permission)),
    [hasPermission]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        clearMustChangePassword,
        hasPermission,
        hasAnyPermission,
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
