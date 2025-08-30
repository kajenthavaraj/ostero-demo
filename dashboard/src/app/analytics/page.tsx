'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/database'
import { DashboardMetrics, Application, CallLog } from '@/types'
import { 
  BarChart3, 
  Users, 
  Phone, 
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Calendar,
  Download
} from 'lucide-react'
import { 
  formatCurrency, 
  formatCallDuration, 
  formatRelativeTime 
} from '@/lib/utils'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      
      // Fetch dashboard metrics
      const metricsResult = await db.getDashboardMetrics(timeRange)
      if (metricsResult.success) {
        setMetrics(metricsResult.data!)
      }
      
      // Fetch recent applications
      const appsResult = await db.getApplications(undefined, 10, 0)
      if (appsResult.success) {
        setRecentApplications(appsResult.data || [])
      }
      
      // Fetch recent calls
      const callsResult = await db.getCallLogs(undefined, 10, 0)
      if (callsResult.success) {
        setRecentCalls(callsResult.data || [])
      }
      
      setLoading(false)
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex-1">
        <Header title="Analytics" subtitle="Loading analytics data..." />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalCalls = recentCalls.length
  const completedCalls = recentCalls.filter(call => call.status === 'completed').length
  const callSuccessRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
  
  const totalCost = recentCalls.reduce((sum, call) => sum + (call.cost_total || 0), 0)
  const avgCost = totalCalls > 0 ? totalCost / totalCalls : 0
  
  const totalDuration = recentCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0)
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

  return (
    <div className="flex-1">
      <Header 
        title="Analytics" 
        subtitle={`Performance insights and metrics for ${timeRange === 'all' ? 'all time' : `last ${timeRange}`}`}
        actions={
          <div className="flex items-center space-x-2">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_applications || recentApplications.length}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.completion_rate || 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                {callSuccessRate}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCallDuration(avgDuration)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCallDuration(totalDuration)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Call Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(avgCost)} avg per call
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.source_breakdown?.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {source.source === 'Voice' ? (
                          <Phone className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Users className="w-4 h-4 text-green-500" />
                        )}
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <span className="font-medium">{source.count}</span>
                    </div>
                    <div className="space-y-1">
                      <Progress 
                        value={source.count > 0 ? (source.completed / source.count) * 100 : 0} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{source.completed} completed</span>
                        <span>{source.count > 0 ? Math.round((source.completed / source.count) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No source data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {metrics?.status_breakdown?.map((status) => (
                  <div key={status.status} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{status.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{status.count}</span>
                      <Badge variant="outline">
                        {metrics.total_applications > 0 
                          ? Math.round((status.count / metrics.total_applications) * 100)
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No status data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Recent Applications
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/applications">View All</a>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentApplications.slice(0, 5).map((app) => {
                  const fullName = app.full_legal_name || 
                    `${app.first_name || ''} ${app.last_name || ''}`.trim() || 
                    'Unknown'
                  
                  return (
                    <div key={app.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {app.email || 'No email'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={app.completed ? 'default' : 'secondary'} className="text-xs">
                          {app.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(app.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {recentApplications.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No recent applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Recent Calls
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/calls">View All</a>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCalls.slice(0, 5).map((call) => (
                  <div key={call.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium font-mono">
                          {call.phone_number || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {call.duration_seconds ? formatCallDuration(call.duration_seconds) : 'Unknown duration'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={call.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {call.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {call.started_at ? formatRelativeTime(call.started_at) : 'Unknown time'}
                      </div>
                    </div>
                  </div>
                ))}
                {recentCalls.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    <Phone className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No recent calls</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.completion_rate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Application Completion Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {callSuccessRate}%
                </div>
                <div className="text-sm text-muted-foreground">Call Success Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.conversion_rate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Voice to Completion Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(avgCost)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Cost Per Call</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}