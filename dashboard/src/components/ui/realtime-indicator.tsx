'use client'

import { useRealtime } from '@/contexts/realtime-context'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

export function RealtimeIndicator() {
  const { isConnected } = useRealtime()

  return (
    <Badge 
      variant={isConnected ? 'default' : 'secondary'}
      className="text-xs"
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  )
}