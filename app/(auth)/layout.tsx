import { Palmtree } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-900 via-jungle-800 to-jungle-700 flex flex-col">
      {/* Dot texture */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px]" />

      {/* Logo */}
      <div className="relative p-8">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 bg-sunset-500 rounded-xl flex items-center justify-center">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">Sunda Trips</span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </div>
    </div>
  )
}
