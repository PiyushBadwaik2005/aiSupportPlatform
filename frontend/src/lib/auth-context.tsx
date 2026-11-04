"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "./api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  businessId: string;
}

export interface Business {
  _id: string;
  name: string;
  slug: string;
  website?: string;
  settings?: {
    defaultGreeting: string;
    fallbackMessage: string;
    minRelevanceScore: number;
    ragRetrievalMode: "keyword" | "vector" | "hybrid";
  };
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    website?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateBusinessState: (updated: Business) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchCurrentUser(authToken: string) {
    try {
      const res = await apiRequest<{ user: User; business: Business }>("/v1/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.success && res.data) {
        setUser(res.data.user);
        setBusiness(res.data.business);
      } else {
        // Token expired or invalid
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setBusiness(null);
      }
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await apiRequest<{ user: User; business: Business; token: string }>(
      "/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    if (res.success && res.data) {
      setUser(res.data.user);
      setBusiness(res.data.business);
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return { success: true };
    }
    return { success: false, error: res.error || "Login failed" };
  }

  async function register(data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    website?: string;
  }) {
    const res = await apiRequest<{ user: User; business: Business; token: string }>(
      "/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (res.success && res.data) {
      setUser(res.data.user);
      setBusiness(res.data.business);
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return { success: true };
    }
    return { success: false, error: res.error || "Registration failed" };
  }

  async function logout() {
    await apiRequest("/v1/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setBusiness(null);
    router.push("/login");
  }

  function updateBusinessState(updated: Business) {
    setBusiness(updated);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateBusinessState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

