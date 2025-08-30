'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  BarChart3, 
  Users, 
  Phone, 
  FileText, 
  Home,
  Activity
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Applications', href: '/applications', icon: Users },
  { name: 'Call Logs', href: '/calls', icon: Phone },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Activity', href: '/activity', icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-full">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="Call Fusion Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold">Call Fusion</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          CallFusion Application Manager
        </div>
      </div>
    </div>
  )
}