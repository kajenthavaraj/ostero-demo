'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/database'
import { CallLog } from '@/types'
import { 
  ArrowLeft, 
  Phone, 
  Clock, 
  DollarSign,
  FileText,
  User,
  Calendar,
  Activity,
  Download,
  PlayCircle
} from 'lucide-react'
import { 
  formatRelativeTime, 
  formatCallDuration, 
  formatPhoneNumber, 
  formatCurrency,
  formatDateTime,
  getStatusVariant 
} from '@/lib/utils'
import Link from 'next/link'

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [call, setCall] = useState<CallLog | null>(null)
  const [loading, setLoading] = useState(true)

  const callId = params.id as string

  useEffect(() => {
    const fetchCall = async () => {
      setLoading(true)
      const result = await db.getCallLog(callId)
      
      if (result.success) {
        setCall(result.data!)
      }
      setLoading(false)
    }

    fetchCall()
  }, [callId])

  if (loading) {
    return (
      <div className="flex-1">
        <Header title="Loading..." subtitle="Fetching call details" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="flex-1">
        <Header title="Call Not Found" subtitle="The requested call could not be found" />
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Phone className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Call Not Found</h3>
                <p className="text-sm mb-4">The call with ID {callId} does not exist.</p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <Header 
        title={`Call ${formatPhoneNumber(call.phone_number || '')}`}
        subtitle={`Call ID: ${call.vapi_call_id}`}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {call.full_transcript && (
              <Button variant="outline" size="sm">
                <PlayCircle className="w-4 h-4 mr-2" />
                Play Recording
              </Button>
            )}
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Call Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusVariant(call.status)}>
                {call.status}
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {(() => {
                    // First try stored duration
                    if (call.duration_seconds && call.duration_seconds > 0) {
                      return formatCallDuration(call.duration_seconds)
                    }
                    // Then try calculating from start/end times
                    if (call.started_at && call.ended_at) {
                      const duration = Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
                      return formatCallDuration(duration)
                    }
                    // Finally, try calculating from transcript timing
                    if (Array.isArray(call.full_transcript) && call.full_transcript.length > 0) {
                      const lastMessage = call.full_transcript[call.full_transcript.length - 1]
                      if (lastMessage.secondsFromStart && lastMessage.secondsFromStart > 0) {
                        return formatCallDuration(Math.floor(lastMessage.secondsFromStart))
                      }
                    }
                    return 'In progress...'
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {call.cost_total && call.cost_total > 0 
                    ? formatCurrency(call.cost_total)
                    : call.status === 'completed' 
                      ? <span className="text-muted-foreground">Pending cost data</span>
                      : <span className="text-muted-foreground">In progress...</span>
                  }
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Application</CardTitle>
            </CardHeader>
            <CardContent>
              {call.application_id ? (
                <Link 
                  href={`/applications/${call.application_id}`}
                  className="flex items-center space-x-2 text-primary hover:underline text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>View Application</span>
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">No application linked</span>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <div className="text-sm font-mono">
                  {call.phone_number ? formatPhoneNumber(call.phone_number) : 'Unknown'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">VAPI Call ID</label>
                <div className="text-sm font-mono">{call.vapi_call_id}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Started At</label>
                <div className="text-sm">
                  {call.started_at ? formatDateTime(call.started_at) : 'Unknown'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ended At</label>
                <div className="text-sm">
                  {call.ended_at ? formatDateTime(call.ended_at) : 'Unknown'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Duration</label>
                <div className="text-sm">
                  {(() => {
                    // First try stored duration
                    if (call.duration_seconds && call.duration_seconds > 0) {
                      return formatCallDuration(call.duration_seconds)
                    }
                    // Then try calculating from start/end times
                    if (call.started_at && call.ended_at) {
                      const duration = Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
                      return (
                        <div>
                          <div>{formatCallDuration(duration)}</div>
                          <div className="text-xs text-muted-foreground">Calculated from timestamps</div>
                        </div>
                      )
                    }
                    // Finally, try calculating from transcript timing
                    if (Array.isArray(call.full_transcript) && call.full_transcript.length > 0) {
                      const lastMessage = call.full_transcript[call.full_transcript.length - 1]
                      if (lastMessage.secondsFromStart && lastMessage.secondsFromStart > 0) {
                        return (
                          <div>
                            <div>{formatCallDuration(Math.floor(lastMessage.secondsFromStart))}</div>
                            <div className="text-xs text-muted-foreground">From transcript data</div>
                          </div>
                        )
                      }
                    }
                    return <span className="text-muted-foreground">In progress...</span>
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                <div className="text-lg font-semibold">
                  {call.cost_total && call.cost_total > 0 ? (
                    formatCurrency(call.cost_total)
                  ) : call.status === 'completed' ? (
                    <div>
                      <div className="text-muted-foreground">Pending</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cost data not yet received from VAPI
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">In progress...</div>
                  )}
                </div>
              </div>
              
              {call.cost_breakdown && Object.keys(call.cost_breakdown).length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost Breakdown</label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(call.cost_breakdown as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-mono">{typeof value === 'number' ? formatCurrency(value) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : call.status === 'completed' ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost Breakdown</label>
                  <div className="text-xs text-muted-foreground mt-1">
                    Detailed cost breakdown will appear here once received from VAPI's end-of-call report
                  </div>
                </div>
              ) : null}
              
              {/* Estimate cost based on duration if no actual cost */}
              {(!call.cost_total || call.cost_total === 0) && call.status === 'completed' && (
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Estimated Cost</label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {(() => {
                      let duration = 0
                      if (call.duration_seconds && call.duration_seconds > 0) {
                        duration = call.duration_seconds
                      } else if (call.started_at && call.ended_at) {
                        duration = Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
                      }
                      
                      if (duration > 0) {
                        // Rough estimate: $0.05 per minute for voice AI calls
                        const estimatedCost = Math.max(0.02, (duration / 60) * 0.05)
                        return `~${formatCurrency(estimatedCost)} (${Math.ceil(duration / 60)} min @ ~$0.05/min)`
                      }
                      return 'Unable to estimate'
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transcript Summary */}
        {call.transcript_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {call.transcript_summary}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Transcript */}
        {call.full_transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Full Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {Array.isArray(call.full_transcript) ? (
                  <div className="space-y-3">
                    {(call.full_transcript as any[]).map((message, index) => {
                      // Skip system messages as they're too verbose
                      if (message.role === 'system') return null
                      
                      return (
                        <div key={index} className="border-l-2 border-muted pl-4 py-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge 
                              variant={message.role === 'assistant' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {message.role === 'assistant' ? 'AI' : 
                               message.role === 'user' ? 'User' : 
                               message.role || message.speaker || 'Unknown'}
                            </Badge>
                            {(message.timestamp || message.time) && (
                              <span className="text-xs text-muted-foreground">
                                {message.secondsFromStart !== undefined ? 
                                  `${Math.floor(message.secondsFromStart)}s` :
                                  formatRelativeTime(message.timestamp || message.time)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">
                            {message.content || message.text || message.message || 'No content'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : call.full_transcript && typeof call.full_transcript === 'string' ? (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {call.full_transcript}
                  </div>
                ) : call.full_transcript ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Raw transcript data:</p>
                    <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted p-3 rounded">
                      {JSON.stringify(call.full_transcript, null, 2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No transcript available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Data */}
        {call.extracted_data && Object.keys(call.extracted_data).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Extracted Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(call.extracted_data as Record<string, any>).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </label>
                    <div className="text-sm">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        {call.performance_metrics && Object.keys(call.performance_metrics).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(call.performance_metrics as Record<string, any>).map(([key, value]) => {
                  // Helper function to format metric values properly
                  const formatMetricValue = (key: string, value: any): string => {
                    if (value === null || value === undefined) return 'N/A'
                    
                    // Handle arrays (like turnLatencies)
                    if (Array.isArray(value)) {
                      if (value.length === 0) return 'No data'
                      if (value.every(v => typeof v === 'number')) {
                        const avg = value.reduce((a, b) => a + b, 0) / value.length
                        return `${Math.round(avg)}ms (${value.length} samples)`
                      }
                      return `${value.length} items`
                    }
                    
                    // Handle objects
                    if (typeof value === 'object') {
                      return 'See details below'
                    }
                    
                    // Handle numbers with appropriate units
                    if (typeof value === 'number') {
                      // Latency metrics (in milliseconds)
                      if (key.toLowerCase().includes('latency') || key.toLowerCase().includes('duration')) {
                        return `${Math.round(value)}ms`
                      }
                      // Cost metrics
                      if (key.toLowerCase().includes('cost')) {
                        return formatCurrency(value)
                      }
                      // Time metrics (could be seconds)
                      if (key.toLowerCase().includes('time')) {
                        return value > 100 ? `${Math.round(value)}ms` : `${value.toFixed(2)}s`
                      }
                      // Default number formatting
                      return value.toLocaleString()
                    }
                    
                    return String(value)
                  }
                  
                  // Format the key name for display
                  const displayKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                    .trim()
                  
                  return (
                    <div key={key} className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2 font-medium">
                        {displayKey}
                      </div>
                      <div className="text-lg font-semibold text-primary">
                        {formatMetricValue(key, value)}
                      </div>
                      {Array.isArray(value) && value.length > 0 && typeof value[0] === 'number' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Min: {Math.min(...value)}ms, Max: {Math.max(...value)}ms
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Show detailed breakdown for complex metrics */}
              {Object.entries(call.performance_metrics as Record<string, any>).some(([_, value]) => 
                typeof value === 'object' && !Array.isArray(value) && value !== null
              ) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Detailed Metrics</h4>
                  <div className="space-y-3">
                    {Object.entries(call.performance_metrics as Record<string, any>).map(([key, value]) => {
                      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                        return (
                          <div key={key} className="text-sm">
                            <div className="font-medium mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                            </div>
                            <div className="ml-4 text-muted-foreground font-mono text-xs bg-muted p-2 rounded">
                              {JSON.stringify(value, null, 2)}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Call Metadata
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const metadata = {
                    'Call ID': call.id,
                    'VAPI Call ID': call.vapi_call_id,
                    'Phone Number': call.phone_number,
                    'Status': call.status,
                    'Duration (seconds)': call.duration_seconds,
                    'Cost': call.cost_total,
                    'Started At': call.started_at,
                    'Ended At': call.ended_at,
                    'Created At': call.created_at,
                    'Updated At': call.updated_at,
                    'Application ID': call.application_id,
                    'Transcript Summary': call.transcript_summary
                  }
                  
                  const text = Object.entries(metadata)
                    .filter(([_, value]) => value !== null && value !== undefined)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
                  
                  navigator.clipboard.writeText(text)
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Copy Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Database ID</label>
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1 break-all">
                    {call.id}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">VAPI Call ID</label>
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1 break-all">
                    {call.vapi_call_id}
                  </div>
                </div>
                
                {call.application_id && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Application ID</label>
                    <div className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1 break-all">
                      <Link 
                        href={`/applications/${call.application_id}`}
                        className="text-primary hover:underline"
                      >
                        {call.application_id}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</label>
                  <div className="text-sm mt-1">
                    <div>{formatDateTime(call.created_at)}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatRelativeTime(call.created_at)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Updated</label>
                  <div className="text-sm mt-1">
                    <div>{formatDateTime(call.updated_at)}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatRelativeTime(call.updated_at)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Call Duration</label>
                  <div className="text-sm mt-1">
                    {(() => {
                      // First try stored duration
                      if (call.duration_seconds && call.duration_seconds > 0) {
                        return (
                          <>
                            <div>{formatCallDuration(call.duration_seconds)}</div>
                            <div className="text-muted-foreground text-xs">From VAPI data</div>
                          </>
                        )
                      }
                      // Then try calculating from start/end times
                      if (call.started_at && call.ended_at) {
                        const duration = Math.floor((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
                        return (
                          <>
                            <div>{formatCallDuration(duration)}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatDateTime(call.started_at)} → {formatDateTime(call.ended_at)}
                            </div>
                          </>
                        )
                      }
                      // Finally, try calculating from transcript timing
                      if (Array.isArray(call.full_transcript) && call.full_transcript.length > 0) {
                        const lastMessage = call.full_transcript[call.full_transcript.length - 1]
                        if (lastMessage.secondsFromStart && lastMessage.secondsFromStart > 0) {
                          return (
                            <>
                              <div>{formatCallDuration(Math.floor(lastMessage.secondsFromStart))}</div>
                              <div className="text-muted-foreground text-xs">From transcript timing</div>
                            </>
                          )
                        }
                      }
                      return <div className="text-muted-foreground">In progress...</div>
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}