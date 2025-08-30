'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RealtimeIndicator } from '@/components/ui/realtime-indicator'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {actions}
          
          <div className="flex items-center space-x-2">
            <RealtimeIndicator />
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}