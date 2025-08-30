'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { ApplicationsTable } from '@/components/dashboard/applications-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/database'
import { Application } from '@/types'
import { useRealtimeApplications } from '@/contexts/realtime-context'
import { Search, Filter, Download, Plus, Wifi, WifiOff } from 'lucide-react'

export default function ApplicationsPage() {
  const { applications: realtimeApplications, setApplications: setRealtimeApplications } = useRealtimeApplications()
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'started'>('all')

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true)
      const result = await db.getApplications(undefined, 100, 0)
      
      if (result.success) {
        const fetchedApps = result.data || []
        setApplications(fetchedApps)
        setRealtimeApplications(fetchedApps)
        setFilteredApplications(fetchedApps)
      }
      setLoading(false)
    }

    fetchApplications()
  }, [setRealtimeApplications])

  // Use realtime applications when available
  useEffect(() => {
    if (realtimeApplications.length > 0) {
      setApplications(realtimeApplications)
    }
  }, [realtimeApplications])

  useEffect(() => {
    let filtered = applications

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const fullName = app.full_legal_name || 
          `${app.first_name || ''} ${app.last_name || ''}`.trim() || 
          'Unknown'
        const email = app.email || ''
        const phone = app.phone || ''
        const searchLower = searchTerm.toLowerCase()
        
        return fullName.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               phone.includes(searchTerm) ||
               app.id.toLowerCase().includes(searchLower)
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        const progress = calculateProgress(app)
        switch (statusFilter) {
          case 'completed':
            return app.completed
          case 'in_progress':
            return !app.completed && progress > 50
          case 'started':
            return !app.completed && progress <= 50
          default:
            return true
        }
      })
    }

    setFilteredApplications(filtered)
  }, [applications, searchTerm, statusFilter])

  const calculateProgress = (application: Application): number => {
    const fields = [
      application.first_name,
      application.last_name,
      application.email,
      application.phone,
      application.date_of_birth,
      application.ssn,
      application.current_address,
      application.employment_status,
      application.annual_income,
      application.desired_loan_amount
    ]
    
    const completedFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length
    
    return Math.round((completedFields / fields.length) * 100)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting applications...')
  }

  return (
    <div className="flex-1">
      <Header 
        title="Applications" 
        subtitle={`Managing ${applications.length} applications`}
        actions={
          <div className="flex items-center space-x-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Application
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
                placeholder="Search applications..."
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
              <option value="in_progress">In Progress</option>
              <option value="started">Started</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Applications Table */}
        <ApplicationsTable 
          applications={filteredApplications}
          loading={loading}
        />

        {/* Pagination - TODO: Implement if needed */}
        {!loading && filteredApplications.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        )}
      </div>
    </div>
  )
}