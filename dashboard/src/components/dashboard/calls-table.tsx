'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CallLog } from '@/types'
import { 
  formatRelativeTime, 
  formatCallDuration, 
  formatPhoneNumber,
  formatCurrency,
  getStatusVariant,
  truncate
} from '@/lib/utils'
import { Phone, Eye, MoreHorizontal, PlayCircle, FileText } from 'lucide-react'

interface CallsTableProps {
  calls: CallLog[]
  loading?: boolean
}

export function CallsTable({ calls, loading }: CallsTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!calls.length) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium mb-1">No calls found</h3>
          <p className="text-sm">Call logs will appear here as calls are made</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Application</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">
                    {call.phone_number ? formatPhoneNumber(call.phone_number) : 'Unknown'}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                {call.application_id ? (
                  <Link 
                    href={`/applications/${call.application_id}`}
                    className="text-primary hover:underline"
                  >
                    {call.application_id.slice(0, 8)}...
                  </Link>
                ) : (
                  <span className="text-muted-foreground">No application</span>
                )}
              </TableCell>
              
              <TableCell>
                <Badge variant={getStatusVariant(call.status)}>
                  {call.status}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {call.duration_seconds ? formatCallDuration(call.duration_seconds) : '-'}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {call.cost_total ? formatCurrency(call.cost_total) : '-'}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {call.started_at ? formatRelativeTime(call.started_at) : 'Unknown'}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="max-w-xs">
                  {call.transcript_summary ? (
                    <div className="text-sm text-muted-foreground">
                      {truncate(call.transcript_summary, 60)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No summary</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/calls/${call.id}`} title="View call details">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  
                  {call.full_transcript && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Download transcript"
                      onClick={() => {
                        const transcript = Array.isArray(call.full_transcript) 
                          ? call.full_transcript
                              .filter((msg: any) => msg.role !== 'system')
                              .map((msg: any) => `${msg.role?.toUpperCase() || 'UNKNOWN'}: ${msg.content || msg.text || msg.message || ''}`)
                              .join('\n\n')
                          : typeof call.full_transcript === 'string' 
                            ? call.full_transcript 
                            : JSON.stringify(call.full_transcript, null, 2)
                        
                        const blob = new Blob([transcript], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `call-transcript-${call.vapi_call_id}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}