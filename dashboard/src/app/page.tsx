'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/database'
import { DashboardMetrics } from '@/types'
import { 
  Users, 
  Phone, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { LiveTranscriptOverview } from '@/components/LiveTranscriptOverview'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      const result = await db.getDashboardMetrics(timeRange)
      
      if (result.success) {
        setMetrics(result.data!)
      }
      setLoading(false)
    }

    fetchMetrics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex-1">
        <Header title="Dashboard" subtitle="Overview of your lead management system" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="flex-1">
      <Header 
        title="Dashboard" 
        subtitle="Overview of your lead management system"
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
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_applications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active lead applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.completion_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Applications completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Call Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.average_call_duration || 0}m</div>
              <p className="text-xs text-muted-foreground">
                Average per call
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.conversion_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Voice to completion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.source_breakdown?.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {source.source === 'Voice' ? (
                        <Phone className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Users className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">{source.source}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{source.count}</span>
                      <Badge variant="secondary">
                        {source.count > 0 ? Math.round((source.completed / source.count) * 100) : 0}% completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Transcript Overview */}
          <LiveTranscriptOverview />

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.recent_activity?.slice(0, 5).map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                ))}
                {!metrics?.recent_activity?.length && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics?.status_breakdown?.map((status) => (
                <div key={status.status} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{status.count}</div>
                  <div className="text-sm text-muted-foreground">{status.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}