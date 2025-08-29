// Route: /  (Home Page)
"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/components/auth/auth-context"
import EwastePortal from "@/components/e-waste-portal"
import EwasteImageScroller from "@/components/ewaste-image-scroller"
import { Button } from "@/components/ui/button"
import { Recycle } from "lucide-react"

const features = [
  {
    icon: (
      <img src="https://www.lg.com/content/dam/lge/in/migration/recycling/images/e-waste.png" alt="E-Waste Logo" width={36} height={36} style={{borderRadius:'8px',boxShadow:'0 2px 8px #0001'}} />
    ),
    title: (
      <span className="flex items-center gap-2 font-bold">
        Track Your E-Waste
      </span>
    ),
    desc: "Easily add, manage, and monitor your electronic waste items in one place."
  },
  {
    icon: (
      <img src="https://img.freepik.com/premium-vector/vector-illustration-delivery-icon-with-pickup-truck-suitable-fast-delivery_414847-512.jpg" alt="Schedule Pickup Logo" width={36} height={100} style={{borderRadius:'8px',boxShadow:'0 2px 8px #0001',objectFit:'cover'}} />
    ),
    title: "Schedule Pickups",
    desc: "Book convenient pickup slots for your e-waste and let us handle the rest."
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l1.41-1.41M6.34 6.34L4.93 4.93" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/></svg>
    ),
    title: "Eco-Friendly Disposal",
    desc: "We ensure your e-waste is recycled responsibly and sustainably."
  },
  {
    icon: (
      <img src="https://thumbs.dreamstime.com/b/compliance-inspection-approved-logo-design-checkbox-form-survey-checklist-audit-document-icon-result-report-verification-279004971.jpg" alt="Schedule Pickup Logo" width={36} height={100} style={{borderRadius:'8px',boxShadow:'0 2px 8px #0001',objectFit:'cover'}} />
    ),
    title: "Compliance Reports",
    desc: "Download detailed reports for your records and regulatory needs."
  }
]

function HomeOrPortal() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  if (loading) return null
  if (isAuthenticated) return <EwastePortal />
  return (
  <main className="min-h-screen flex flex-col relative overflow-hidden pt-[120px]">
      {/* Modern Diagonal Green-Purple Gradient Background */}
      <div
        className="absolute inset-0 -z-10 w-full h-full"
        style={{
          background: 'linear-gradient(120deg, #a7f3d0 0%, #6d28d9 100%)',
        }}
      />
      {/* Decorative SVGs */}

      {/* Header */}
  <header className="fixed top-0 left-1/2 -translate-x-1/2 max-w-[98%] w-full mx-auto flex flex-col sm:flex-row justify-between items-center px-3 sm:px-8 py-2 sm:py-6 bg-white/60 shadow-sm z-40 rounded-2xl sm:rounded-4xl backdrop-blur-md gap-2 sm:gap-2 mb-6 sm:mb-12 mt-3">
        <div className="flex gap-2 sm:gap-4 items-center">
          <Recycle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 opacity-90 drop-shadow-lg" aria-hidden />
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-700 tracking-tight drop-shadow-lg text-center sm:text-left whitespace-nowrap">E-Waste Management Portal</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-center sm:items-end justify-center sm:justify-end">
          <Button
            variant="outline"
            className="transition-all hover:bg-emerald-100 hover:text-emerald-700 focus:ring-2 focus:ring-emerald-400 w-full sm:w-auto text-base sm:text-lg px-4 sm:px-6 py-2"
            onClick={() => router.push('/login')}
          >Login</Button>
          <Button
            variant="secondary"
            className="transition-all bg-gradient-to-r from-emerald-400 to-blue-400 text-white shadow-md hover:from-emerald-500 hover:to-blue-500 focus:ring-2 focus:ring-blue-300 w-full sm:w-auto text-base sm:text-lg px-4 sm:px-6 py-2"
            onClick={() => router.push('/signup')}
          >Sign Up</Button>
        </div>
      </header>
  {/* Body */}
  <section className="flex flex-1 flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-8 sm:py-12 gap-6 sm:gap-8 max-w-6xl mx-auto w-full">
        {/* Left: Title & About */}
        <div className="flex-1 flex flex-col gap-4 z-10">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-blue-700 to-pink-600 drop-shadow-xl mb-2 animate-fade-in text-center md:text-left">Empowering Responsible E-Waste Disposal</h1>
          <p className="text-base sm:text-xl text-emerald-950/90 max-w-xl animate-fade-in delay-100 text-center md:text-left">
            Our E-Waste Management Portal is a smart, end-to-end solution for the safe, efficient, and eco-friendly disposal of electronic waste. From scheduling pickups and generating QR-based tracking for each item, to monitoring its journey through collection, sorting, and recycling, our platform ensures complete transparency and compliance. Users can easily track their items in real time, access sustainability reports, and contribute to a cleaner, greener future—all from one convenient dashboard.
          </p>
          <div className="mt-4 w-full sm:w-fit animate-fade-in delay-200 flex justify-center md:justify-start">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-8 sm:px-10 py-4 sm:py-6 text-lg sm:text-xl rounded-full shadow-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 w-full sm:w-auto"
              onClick={() => router.push('/login')}
            >Get Started</Button>
          </div>
        </div>
        {/* Right: Image */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 z-10 w-full">
          <img
            src="https://ewasterecyclersindia.com/images/ewast.png"
            alt="E-Waste Illustration"
            width={600}
            height={500}
            className="object-contain animate-float w-80 sm:w-[500px] h-auto"
            loading="eager"
          />
          {/* Features */}
          
        </div>
        
      </section>
  <div className="max-w-full sm:max-w-[60%] container mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10 w-full animate-fade-in delay-300 pb-8 sm:pb-10 px-2 sm:px-0">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6 bg-white/80 rounded-2xl shadow-xl p-4 sm:p-8 min-h-[140px] sm:min-h-[170px] h-auto border border-emerald-100 hover:scale-[1.03] hover:shadow-emerald-200/60 transition-all duration-200 group relative overflow-hidden w-full"
            style={{boxShadow:'0 8px 32px 0 rgba(16,185,129,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04)'}}
          >
            <div className="shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-100 via-blue-100 to-pink-100 shadow-inner border border-emerald-200 group-hover:from-emerald-200 group-hover:to-blue-200 mb-2 sm:mb-0">
              {f.icon}
            </div>
            <div className="flex flex-col justify-center h-full text-center sm:text-left w-full">
              <div className="font-extrabold text-lg sm:text-2xl text-emerald-700 mb-1 sm:mb-2 group-hover:text-blue-700 transition-colors leading-tight break-words">
                {typeof f.title === 'string' ? <span>{f.title}</span> : f.title}
              </div>
              <div className="text-emerald-900/90 text-sm sm:text-lg leading-snug max-w-full sm:max-w-xs">
                {f.desc}
              </div>
            </div>
            {/* Decorative blurred circle */}
            <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-emerald-200/30 blur-2xl opacity-60 group-hover:opacity-80 transition-all" />
          </div>
        ))}
      </div>
          {/* E-waste image scroller */}
      <div className="max-w-6xl mx-auto w-full">
        <EwasteImageScroller />
      </div>
      {/* Animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
        .animate-gradient { animation: gradient 12s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
        .delay-100 { animation-delay: .1s; }
        .delay-200 { animation-delay: .2s; }
        .delay-300 { animation-delay: .3s; }
      `}</style>

      {/* Unique Footer */}
      <footer className="w-full bg-gradient-to-br from-emerald-900 via-blue-900 to-purple-900 text-white py-10 px-4 mt-12 border-t border-emerald-200/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 md:gap-24 lg:gap-32 xl:gap-40">
          <div className="flex-1 min-w-[300px] mb-8 md:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-purple-500 shadow-lg">
                <Recycle className="w-6 h-6 text-white" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight">E-Waste Portal</span>
            </div>
            <p className="text-emerald-100/90 text-base max-w-xs leading-relaxed">Empowering campuses and communities to recycle electronics responsibly and build a greener future.</p>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="font-bold text-lg mb-2 text-emerald-100">Platform</div>
            <ul className="space-y-1 text-emerald-100/80">
              <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
              <li><a href="/dashboard/analytics" className="hover:underline">Analytics</a></li>
              <li><a href="/api" className="hover:underline">API</a></li>
            </ul>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="font-bold text-lg mb-2 text-emerald-100">Community</div>
            <ul className="space-y-1 text-emerald-100/80">
              <li><a href="#about" className="hover:underline">About</a></li>
              <li><a href="#impact" className="hover:underline">Impact</a></li>
              <li><a href="#contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="font-bold text-lg mb-2 text-emerald-100">Support</div>
            <ul className="space-y-1 text-emerald-100/80">
              <li><a href="#help" className="hover:underline">Help Center</a></li>
              <li><a href="#privacy" className="hover:underline">Privacy</a></li>
              <li><a href="#terms" className="hover:underline">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-emerald-100/20 pt-6 text-center text-emerald-100/60 text-sm">
          © {new Date().getFullYear()} E-Waste Portal. All rights reserved.
        </div>
      </footer>
    </main>
  )
}


export default function Page() {
  return (
    <AuthProvider>
      <HomeOrPortal />
    </AuthProvider>
  )
}
