'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Application, CallLog } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://totgazkleqdkdsebyahk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdGdhemtsZXFka2RzZWJ5YWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTI1NjUsImV4cCI6MjA3MDk2ODU2NX0.1I-_jpS_EuuPfmk2F7ZCvBn5wYJ1SD0ExzD3DwulJ4Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RealtimeContextType {
  applications: Application[]
  callLogs: CallLog[]
  isConnected: boolean
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>
  setCallLogs: React.Dispatch<React.SetStateAction<CallLog[]>>
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Set up real-time subscription for applications
    const applicationsChannel = supabase
      .channel('applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        (payload) => {
          console.log('Applications change received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setApplications(prev => [payload.new as Application, ...prev])
              break
            case 'UPDATE':
              setApplications(prev => 
                prev.map(app => 
                  app.id === payload.new.id ? payload.new as Application : app
                )
              )
              break
            case 'DELETE':
              setApplications(prev => 
                prev.filter(app => app.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('Applications subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Set up real-time subscription for call logs
    const callLogsChannel = supabase
      .channel('call_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs',
        },
        (payload) => {
          console.log('Call logs change received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setCallLogs(prev => [payload.new as CallLog, ...prev])
              break
            case 'UPDATE':
              setCallLogs(prev => 
                prev.map(call => 
                  call.id === payload.new.id ? payload.new as CallLog : call
                )
              )
              break
            case 'DELETE':
              setCallLogs(prev => 
                prev.filter(call => call.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('Call logs subscription status:', status)
      })

    // Cleanup function
    return () => {
      applicationsChannel.unsubscribe()
      callLogsChannel.unsubscribe()
    }
  }, [])

  const value = {
    applications,
    callLogs,
    isConnected,
    setApplications,
    setCallLogs,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for real-time applications
export function useRealtimeApplications() {
  const { applications, setApplications } = useRealtime()
  return { applications, setApplications }
}

// Hook for real-time call logs
export function useRealtimeCallLogs() {
  const { callLogs, setCallLogs } = useRealtime()
  return { callLogs, setCallLogs }
}