"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthProvider, useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Suspense } from "react"

export default function LoginPage() {
 return (
  <AuthProvider>
   <Suspense fallback={<div>Loading...</div>}>
    <LoginScreen />
   </Suspense>
  </AuthProvider>
 )
}

function LoginScreen() {
 const { login, isAuthenticated, loading, user } = useAuth() 
 const router = useRouter()
 const searchParams = useSearchParams()
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [error, setError] = useState<string | null>(null)
 const [pending, setPending] = useState(false)
 const [showSuccess, setShowSuccess] = useState(false)

 useEffect(() => {
  if (!loading && isAuthenticated && user) {
      if (user.role === 'vendor') {
        router.replace("/vendors/dashboard");
      } else {
        router.replace("/dashboard"); // unified dashboard landing
      }
   return;
  }
  if (searchParams.get('signup') === 'success') {
   setShowSuccess(true)
   const timer = setTimeout(() => setShowSuccess(false), 5000)
   return () => clearTimeout(timer)
  }
 }, [loading, isAuthenticated, user, router, searchParams])

 async function onSubmit(e: React.FormEvent) {
  e.preventDefault()
  setPending(true)
  setError(null)
  
  const res = await login(email, password);

  setPending(false)

  if (res.ok) {
      if (res.user.role === 'vendor') {
        router.replace("/vendors/dashboard");
      } else {
        router.replace("/dashboard"); // unified dashboard landing
      }
  } else {
   setError(res.message);
  }
 }

 return (
  <div className="min-h-screen" style={{ background: 'linear-gradient(120deg, #a7f3d0 0%, #6d28d9 100%)' }}>
   <div className="max-w-[85%] container mx-auto flex min-h-screen items-center justify-center">
    
    {/* Left Side - Lottie Animation */}
    <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-800 via-blue-800 to-purple-800 bg-clip-text text-transparent drop-shadow-2xl">
                Welcome to E-Waste Portal
              </h1>
              <p className="text-xl text-gray-900 drop-shadow-lg font-bold tracking-wide bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2">
                Sustainable technology management made simple
              </p>
            </div>
            
            <div className="relative">
              <div>
                <DotLottieReact
                  src="https://lottie.host/ffab00a3-218e-4a6d-9634-6e38df3afa52/wi6M52EjDk.lottie"
                  loop
                  autoplay
                  className="w-full h-96"
                />
              </div>
            </div>
          </div>
    </div>

    {/* Right Side - Login Form */}
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
     <div className="w-full max-w-md">
      {showSuccess && (
       <Alert variant="default" className="mb-6 bg-green-100 border-green-300 text-green-800">
        <AlertDescription>Account Created. Please log in.</AlertDescription>
       </Alert>
      )}

            {/* --- FIX: Restored original styling to the Card and its children --- */}
      <Card className="relative border-white/30 bg-white/20 backdrop-blur-lg text-gray-800 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-50"></div>
       <CardHeader className="relative space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-black">Welcome Back</CardTitle>
        <p className="text-black font-semibold text-lg tracking-wide">
         Sign in to manage your e‑waste portal
        </p>
       </CardHeader>
       
       <CardContent className="relative">
        <form onSubmit={onSubmit} className="space-y-6">
         {error && (
          <Alert variant="destructive" className="bg-red-100 border-red-300 text-red-800">
           <AlertDescription>{error}</AlertDescription>
          </Alert>
         )}
         
         <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-800 font-medium">Email Address</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/50 border-white/50 text-gray-800 placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 h-12 transition-all duration-300 hover:bg-white/70" />
         </div>

         <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/50 border-white/50 text-gray-800 placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 h-12 transition-all duration-300 hover:bg-white/70" />
         </div>

         <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group"
                    disabled={pending}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative">
                      {pending ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </span>
                  </Button>
        </form>

        <div className="mt-8 text-center">
         <p className="text-gray-700">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
           Create one
          </Link>
         </p>
        </div>
       </CardContent>
      </Card>
     </div>
    </div>
   </div>
  </div>
 )
}
