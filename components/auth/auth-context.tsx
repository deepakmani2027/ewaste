"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { jwtVerify, SignJWT } from "jose"

// --- FIX: Added 'role' to the AuthUser type ---
export type AuthUser = {
 _id: string
 email: string
 name?: string
  role: 'user' | 'vendor' | 'admin'
}

type AuthContextType = {
 user: AuthUser | null
 token: string | null
 loading: boolean
 isAuthenticated: boolean
 login: (email: string, password: string) => Promise<{ ok: true, user: AuthUser } | { ok: false; message: string }>
 signup: (name: string, email: string, password: string, role: 'user' | 'vendor') => Promise<{ ok: true } | { ok: false; message: string }>
 logout: () => void
 setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
 updateUserProfile: (updates: Partial<AuthUser>) => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = "ew:auth_token"

const SECRET = new TextEncoder().encode(
 process.env.NEXT_PUBLIC_JWT_SECRET || "DEMO_ONLY_CHANGE_ME_32+_BYTES_SECRET_FOR_JWT_SIGNING_2025_EWASTE"
)

async function verifyToken(token: string): Promise<AuthUser | null> {
 try {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as AuthUser
 } catch {
  return null
 }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<AuthUser | null>(null)
 const [token, setToken] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  const initializeAuth = async () => {
   const storedToken = localStorage.getItem(AUTH_STORAGE_KEY)
   if (storedToken) {
    const verifiedUser = await verifyToken(storedToken)
    if (verifiedUser) {
     setUser(verifiedUser)
     setToken(storedToken)
    } else {
     localStorage.removeItem(AUTH_STORAGE_KEY)
    }
   }
   setLoading(false)
  }
  initializeAuth()
 }, [])

 const login = useCallback(async (email: string, password: string) => {
  try {
   const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
   });

   const data = await response.json();

   if (!response.ok) {
    return { ok: false as const, message: data.message || "Login failed." };
   }
   
   const { user: loggedInUser, token: newToken } = data;
   
   setUser(loggedInUser);
   setToken(newToken);
   localStorage.setItem(AUTH_STORAGE_KEY, newToken);

  // Unified post-login landing (ignore any stored redirect intents)
  try { localStorage.removeItem('ew:redirect_path'); } catch {}

   return { ok: true as const, user: loggedInUser };

  } catch (error) {
   console.error("Login API call failed:", error);
   return { ok: false as const, message: "A network error occurred." };
  }
 }, []);

 const signup = useCallback(async (name: string, email: string, password: string, role: 'user' | 'vendor') => {
  try {
   const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
   });

   const data = await response.json();

   if (!response.ok) {
    return { ok: false as const, message: data.message || "Signup failed." };
   }
   
   return { ok: true as const };
  } catch (error) {
   console.error("Signup API call failed:", error);
   return { ok: false as const, message: "A network error occurred." };
  }
 }, []);

 const logout = useCallback(() => {
  setUser(null)
  setToken(null)
  localStorage.removeItem(AUTH_STORAGE_KEY)
 }, [])

 const updateUserProfile = (updates: Partial<AuthUser>) => {
   setUser(prev => prev ? { ...prev, ...updates } : null);
 };
 const value = useMemo(
  () => ({
   user,
   token,
   loading,
   isAuthenticated: !!user && !!token,
   login,
   signup,
   logout,
   setUser,
   updateUserProfile,
  }),
  [user, token, loading, login, signup, logout]
 )

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
 const ctx = useContext(AuthContext)
 if (!ctx) throw new Error("useAuth must be used within AuthProvider")
 return ctx
}
