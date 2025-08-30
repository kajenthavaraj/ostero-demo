import { supabase } from './supabase'
import { 
  Application, 
  CallLog, 
  ApplicationFilters, 
  CallFilters, 
  ApiResponse,
  PaginatedResponse,
  DashboardMetrics 
} from '@/types'

export class DatabaseService {
  
  // ===== APPLICATION METHODS =====
  
  async getApplications(
    filters?: ApplicationFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<Application>> {
    try {
      let query = supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'completed') {
          query = query.eq('completed', true)
        } else if (filters.status === 'in_progress') {
          query = query.eq('completed', false).gte('current_step', 1)
        } else if (filters.status === 'started') {
          query = query.eq('completed', false).lt('current_step', 1)
        }
      }

      if (filters?.dateRange && filters.dateRange !== 'all') {
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        query = query.gte('created_at', fromDate.toISOString())
      }

      if (filters?.searchTerm) {
        query = query.or(
          `first_name.ilike.%${filters.searchTerm}%,` +
          `last_name.ilike.%${filters.searchTerm}%,` +
          `email.ilike.%${filters.searchTerm}%,` +
          `phone.ilike.%${filters.searchTerm}%`
        )
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch applications'
      }
    }
  }

  async getApplication(id: string): Promise<ApiResponse<Application & { call_logs: CallLog[] }>> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          call_logs (
            id,
            vapi_call_id,
            status,
            duration_seconds,
            started_at,
            ended_at,
            transcript_summary,
            cost_total,
            created_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Application not found'
      }
    }
  }

  async createApplication(applicationData: Partial<Application>): Promise<ApiResponse<Application>> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create application'
      }
    }
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<ApiResponse<Application>> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update application'
      }
    }
  }

  // ===== CALL LOG METHODS =====

  async getCallLogs(
    filters?: CallFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<CallLog>> {
    try {
      let query = supabase
        .from('call_logs')
        .select(`
          *,
          applications (
            first_name,
            last_name,
            email,
            phone
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.applicationId) {
        query = query.eq('application_id', filters.applicationId)
      }

      if (filters?.dateRange && filters.dateRange !== 'all') {
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        query = query.gte('created_at', fromDate.toISOString())
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch call logs'
      }
    }
  }

  async getCallLog(id: string): Promise<ApiResponse<CallLog>> {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          applications (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Call log not found'
      }
    }
  }

  // ===== TRANSCRIPT METHODS =====

  async getLiveTranscript(callId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`http://localhost:5001/transcript/${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: { call_id: callId, message_count: 0, transcript: [] }
          }
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch transcript'
      }
    }
  }

  async getAllTranscripts(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:5001/transcripts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch transcripts'
      }
    }
  }

  // ===== ANALYTICS METHODS =====

  async getDashboardMetrics(timeRange: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      
      // Get applications data
      const applicationsQuery = supabase
        .from('applications')
        .select('*')
      
      if (timeRange !== 'all') {
        applicationsQuery.gte('created_at', fromDate.toISOString())
      }

      const { data: applications, error: appsError } = await applicationsQuery
      if (appsError) throw appsError

      // Get call logs data
      const callLogsQuery = supabase
        .from('call_logs')
        .select('*')
      
      if (timeRange !== 'all') {
        callLogsQuery.gte('created_at', fromDate.toISOString())
      }

      const { data: callLogs, error: callsError } = await callLogsQuery
      if (callsError) throw callsError

      // Calculate metrics
      const totalApplications = applications?.length || 0
      const completedApplications = applications?.filter(app => app.completed).length || 0
      const completionRate = totalApplications > 0 ? (completedApplications / totalApplications) * 100 : 0

      const completedCalls = callLogs?.filter(call => 
        call.status === 'completed' || call.status === 'ended'
      ) || []
      
      const totalCallDuration = completedCalls.reduce((sum, call) => 
        sum + (call.duration_seconds || 0), 0
      )
      const averageCallDuration = completedCalls.length > 0 
        ? totalCallDuration / completedCalls.length / 60 
        : 0

      // Calculate conversion rate (applications with calls that completed)
      const applicationsWithCalls = applications?.filter(app => 
        callLogs?.some(call => call.application_id === app.id)
      ) || []
      const completedApplicationsWithCalls = applicationsWithCalls.filter(app => app.completed).length
      const conversionRate = applicationsWithCalls.length > 0 
        ? (completedApplicationsWithCalls / applicationsWithCalls.length) * 100 
        : 0

      // Applications over time (simplified)
      const applicationsOverTime = this.generateTimeSeriesData(applications || [], timeRange)

      // Call success rate
      const callSuccessRate = this.calculateCallSuccessRate(callLogs || [])

      // Recent activity (last 10 items)
      const recentActivity = this.generateRecentActivity(applications || [], callLogs || [])

      // Source breakdown
      const sourceBreakdown = this.calculateSourceBreakdown(applications || [], callLogs || [])

      // Status breakdown
      const statusBreakdown = this.calculateStatusBreakdown(applications || [])

      const metrics: DashboardMetrics = {
        total_applications: totalApplications,
        completion_rate: Math.round(completionRate * 10) / 10,
        average_call_duration: Math.round(averageCallDuration * 10) / 10,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        applications_over_time: applicationsOverTime,
        call_success_rate: callSuccessRate,
        recent_activity: recentActivity,
        source_breakdown: sourceBreakdown,
        status_breakdown: statusBreakdown
      }

      return {
        success: true,
        data: metrics
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard metrics'
      }
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  subscribeToApplications(callback: (payload: any) => void) {
    return supabase
      .channel('applications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications'
      }, callback)
      .subscribe()
  }

  subscribeToCallLogs(callback: (payload: any) => void) {
    return supabase
      .channel('call-logs-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'call_logs'
      }, callback)
      .subscribe()
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateTimeSeriesData(applications: Application[], timeRange: string) {
    // Simplified time series - group by day for now
    const grouped: { [key: string]: { total: number, completed: number } } = {}
    
    applications.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = { total: 0, completed: 0 }
      }
      grouped[date].total += 1
      if (app.completed) grouped[date].completed += 1
    })

    return Object.entries(grouped)
      .map(([date, counts]) => ({
        period: date,
        label: date,
        applications: counts.total,
        completed: counts.completed
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }

  private calculateCallSuccessRate(callLogs: CallLog[]) {
    const statusCount: { [key: string]: number } = {}
    
    callLogs.forEach(call => {
      statusCount[call.status] = (statusCount[call.status] || 0) + 1
    })

    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count
    }))
  }

  private generateRecentActivity(applications: Application[], callLogs: CallLog[]) {
    const activities = [
      ...applications.map(app => ({
        type: app.completed ? 'application_completed' as const : 'application_created' as const,
        id: app.id,
        name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unknown',
        email: app.email || '',
        timestamp: app.completed ? app.updated_at : app.created_at,
        description: app.completed ? 'Completed application' : 'Created new application'
      })),
      ...callLogs
        .filter(call => call.status === 'completed' || call.status === 'ended')
        .map(call => ({
          type: 'call_completed' as const,
          id: call.application_id || call.id,
          name: call.applications ? 
            `${call.applications.first_name || ''} ${call.applications.last_name || ''}`.trim() : 
            'Unknown',
          email: call.applications?.email || '',
          timestamp: call.ended_at || call.updated_at,
          description: `Completed voice call (${Math.round((call.duration_seconds || 0) / 60)} min)`
        }))
    ]

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  private calculateSourceBreakdown(applications: Application[], callLogs: CallLog[]) {
    const applicationsWithCalls = new Set(
      callLogs.map(call => call.application_id).filter(Boolean)
    )

    const voiceCount = applicationsWithCalls.size
    const webCount = applications.length - voiceCount
    
    const voiceCompleted = applications.filter(app => 
      applicationsWithCalls.has(app.id) && app.completed
    ).length
    
    const webCompleted = applications.filter(app => 
      !applicationsWithCalls.has(app.id) && app.completed
    ).length

    return [
      { source: 'Voice' as const, count: voiceCount, completed: voiceCompleted },
      { source: 'Web' as const, count: webCount, completed: webCompleted }
    ].filter(item => item.count > 0)
  }

  private calculateStatusBreakdown(applications: Application[]) {
    const completed = applications.filter(app => app.completed).length
    const inProgress = applications.filter(app => !app.completed && (app.current_step || 0) >= 1).length
    const started = applications.length - completed - inProgress

    return [
      { status: 'Completed' as const, count: completed },
      { status: 'In Progress' as const, count: inProgress },
      { status: 'Started' as const, count: started }
    ].filter(item => item.count > 0)
  }
}

// Export singleton instance
export const db = new DatabaseService()