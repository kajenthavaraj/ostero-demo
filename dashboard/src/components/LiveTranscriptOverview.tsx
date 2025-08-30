'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, PhoneOff, RefreshCw, Eye } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import Link from 'next/link'

interface TranscriptOverview {
  call_id: string
  message_count: number
}

interface AllTranscriptsData {
  total_calls: number
  calls: TranscriptOverview[]
}

export function LiveTranscriptOverview() {
  const [transcripts, setTranscripts] = useState<AllTranscriptsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const db = new DatabaseService()

  const fetchAllTranscripts = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      const result = await db.getAllTranscripts()
      
      if (result.success) {
        setTranscripts(result.data as AllTranscriptsData)
      } else {
        setError(result.error || 'Failed to fetch transcripts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllTranscripts()
    
    // Auto-refresh every 2 seconds for faster updates
    const interval = setInterval(() => {
      fetchAllTranscripts(false)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Live Calls
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllTranscripts()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center text-red-600 py-4">
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchAllTranscripts()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}
        
        {isLoading && !transcripts && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading active calls...</p>
          </div>
        )}

        {transcripts && (
          <div className="space-y-4">
            {transcripts.total_calls === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <PhoneOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No active calls</p>
                <p className="text-sm">Call transcripts will appear here when customers are on calls</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {transcripts.total_calls} active call{transcripts.total_calls !== 1 ? 's' : ''}
                  </p>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    Live
                  </Badge>
                </div>
                
                {transcripts.calls.map((call) => (
                  <div
                    key={call.call_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium text-sm">
                          Call {call.call_id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.message_count} message{call.message_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {call.message_count > 0 ? 'Active' : 'Starting'}
                      </Badge>
                      
                      {/* Try to find the application for this call */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/transcript/${call.call_id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {transcripts.total_calls > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm">
                      View All {transcripts.total_calls} Calls
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LiveTranscriptOverview