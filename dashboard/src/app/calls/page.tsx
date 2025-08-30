'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { CallsTable } from '@/components/dashboard/calls-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/database'
import { CallLog } from '@/types'
import { useRealtimeCallLogs } from '@/contexts/realtime-context'
import { Search, Filter, Download, Phone } from 'lucide-react'
import { formatCallDuration } from '@/lib/utils'

export default function CallsPage() {
  const { callLogs: realtimeCallLogs, setCallLogs: setRealtimeCallLogs } = useRealtimeCallLogs()
  const [calls, setCalls] = useState<CallLog[]>([])
  const [filteredCalls, setFilteredCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'ringing' | 'unknown'>('all')

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true)
      const result = await db.getCallLogs(undefined, 100, 0)
      
      if (result.success) {
        const fetchedCalls = result.data || []
        setCalls(fetchedCalls)
        setRealtimeCallLogs(fetchedCalls)
        setFilteredCalls(fetchedCalls)
      }
      setLoading(false)
    }

    fetchCalls()
  }, [setRealtimeCallLogs])

  // Use realtime call logs when available
  useEffect(() => {
    if (realtimeCallLogs.length > 0) {
      setCalls(realtimeCallLogs)
    }
  }, [realtimeCallLogs])

  useEffect(() => {
    let filtered = calls

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(call => {
        const phone = call.phone_number || ''
        const vapiId = call.vapi_call_id || ''
        const searchLower = searchTerm.toLowerCase()
        
        return phone.includes(searchTerm) ||
               vapiId.toLowerCase().includes(searchLower) ||
               (call.transcript_summary && call.transcript_summary.toLowerCase().includes(searchLower))
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter)
    }

    setFilteredCalls(filtered)
  }, [calls, searchTerm, statusFilter])

  const totalDuration = filteredCalls.reduce((acc, call) => acc + (call.duration_seconds || 0), 0)
  const avgDuration = filteredCalls.length > 0 ? Math.round(totalDuration / filteredCalls.length) : 0

  const handleExport = () => {
    console.log('Exporting call logs...')
  }

  return (
    <div className="flex-1">
      <Header 
        title="Call Logs" 
        subtitle={`${calls.length} calls • ${formatCallDuration(totalDuration)} total duration`}
        actions={
          <div className="flex items-center space-x-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="ringing">Ringing</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Call Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Calls</div>
            <div className="text-2xl font-bold">{filteredCalls.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground">Avg Duration</div>
            <div className="text-2xl font-bold">{formatCallDuration(avgDuration)}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold">
              {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Duration</div>
            <div className="text-2xl font-bold">{formatCallDuration(totalDuration)}</div>
          </div>
        </div>

        {/* Calls Table */}
        <CallsTable 
          calls={filteredCalls}
          loading={loading}
        />

        {/* Pagination */}
        {!loading && filteredCalls.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredCalls.length} of {calls.length} calls
            </div>
          </div>
        )}
      </div>
    </div>
  )
}