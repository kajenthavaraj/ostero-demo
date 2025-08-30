'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, PhoneOff, User, Bot, RefreshCw } from 'lucide-react'
import { DatabaseService } from '@/lib/database'

interface TranscriptMessage {
  role: 'bot' | 'user' | 'assistant' | 'customer'
  message: string
}

interface TranscriptData {
  call_id: string
  message_count: number
  transcript: TranscriptMessage[]
}

interface LiveTranscriptProps {
  callId?: string
  applicationId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function LiveTranscript({ 
  callId, 
  applicationId, 
  autoRefresh = true, 
  refreshInterval = 1000 
}: LiveTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [isCallActive, setIsCallActive] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const db = new DatabaseService()

  // Client-side deduplication function for transcript messages
  const deduplicateMessages = (messages: TranscriptMessage[]): TranscriptMessage[] => {
    const deduplicated: TranscriptMessage[] = []
    
    for (const message of messages) {
      // Check if this message is a progressive update of an existing message
      const existingIndex = deduplicated.findIndex(existing => 
        existing.role === message.role &&
        (
          // Check if new message extends existing message
          (message.message.startsWith(existing.message) && message.message.length > existing.message.length) ||
          // Check if existing message extends new message (keep longer)
          (existing.message.startsWith(message.message) && existing.message.length > message.message.length) ||
          // Check for exact duplicates
          existing.message === message.message
        )
      )
      
      if (existingIndex >= 0) {
        // Replace with longer message or keep existing if it's longer
        if (message.message.length > deduplicated[existingIndex].message.length) {
          deduplicated[existingIndex] = message
        }
        // If existing is longer or equal, keep it (do nothing)
      } else {
        // No similar message found, add as new
        deduplicated.push(message)
      }
    }
    
    return deduplicated
  }

  const fetchTranscript = async (showLoading = true) => {
    if (!callId) return

    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      const result = await db.getLiveTranscript(callId)
      
      if (result.success) {
        const rawTranscript = result.data as TranscriptData
        // Apply client-side deduplication
        const deduplicatedMessages = deduplicateMessages(rawTranscript.transcript)
        const newTranscript = {
          ...rawTranscript,
          transcript: deduplicatedMessages,
          message_count: deduplicatedMessages.length
        }
        setTranscript(newTranscript)
        
        // Check if call is active (new messages coming in)
        if (newTranscript.message_count > lastMessageCount) {
          setIsCallActive(true)
          setLastMessageCount(newTranscript.message_count)
          
          // Auto-scroll to bottom when new messages arrive
          setTimeout(() => {
            if (scrollAreaRef.current) {
              const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
              if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight
              }
            }
          }, 100)
        } else if (newTranscript.message_count === lastMessageCount && lastMessageCount > 0) {
          // No new messages for a while, call might be ended
          setTimeout(() => setIsCallActive(false), 10000) // Wait 10 seconds before marking inactive
        }
      } else {
        setError(result.error || 'Failed to fetch transcript')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  // Set up auto-refresh
  useEffect(() => {
    if (!callId || !autoRefresh) return

    // Initial fetch
    fetchTranscript()

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchTranscript(false) // Don't show loading spinner for background refreshes
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callId, autoRefresh, refreshInterval])

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'bot':
      case 'assistant':
        return <Bot className="w-4 h-4" />
      case 'user':
      case 'customer':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getMessageLabel = (role: string) => {
    switch (role) {
      case 'bot':
      case 'assistant':
        return 'AI Assistant'
      case 'user':
      case 'customer':
        return 'Customer'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'bot':
      case 'assistant':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user':
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!callId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Live Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active call to monitor</p>
            <p className="text-sm">Transcripts will appear here during voice calls</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isCallActive ? (
              <Phone className="w-5 h-5 text-green-500" />
            ) : (
              <PhoneOff className="w-5 h-5 text-gray-400" />
            )}
            Live Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isCallActive ? "default" : "secondary"}
              className={isCallActive ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isCallActive ? "Live" : "Ended"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTranscript()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {callId && (
          <p className="text-sm text-muted-foreground">
            Call ID: {callId}
            {transcript && ` • ${transcript.message_count} messages`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center text-red-600 py-4">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchTranscript()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}
        
        {isLoading && !transcript && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading transcript...</p>
          </div>
        )}

        {transcript && (
          <ScrollArea className="h-[500px] w-full" ref={scrollAreaRef}>
            <div className="space-y-4">
              {transcript.transcript.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Waiting for conversation to start...</p>
                  <p className="text-sm">Messages will appear here as the call progresses</p>
                </div>
              ) : (
                transcript.transcript.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 p-3 rounded-lg border ${getRoleColor(message.role)}`}
                  >
                    <div className="flex-shrink-0">
                      {getMessageIcon(message.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {getMessageLabel(message.role)}
                        </span>
                        <span className="text-xs opacity-75">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default LiveTranscript