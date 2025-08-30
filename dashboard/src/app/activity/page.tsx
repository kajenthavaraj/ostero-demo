'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtimeApplications, useRealtimeCallLogs } from '@/contexts/realtime-context'
import { 
  Activity, 
  Users, 
  Phone, 
  Clock,
  TrendingUp,
  FileText,
  Zap,
  RefreshCw
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'application_created' | 'application_updated' | 'call_started' | 'call_completed'
  title: string
  description: string
  timestamp: string
  icon: any
  color: string
}

export default function ActivityPage() {
  const { applications } = useRealtimeApplications()
  const { callLogs } = useRealtimeCallLogs()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    const newActivities: ActivityItem[] = []

    // Add application activities
    applications.forEach(app => {
      const fullName = app.full_legal_name || 
        `${app.first_name || ''} ${app.last_name || ''}`.trim() || 
        'Unknown User'

      newActivities.push({
        id: `app-${app.id}`,
        type: 'application_created',
        title: 'New Application Submitted',
        description: `${fullName} submitted a mortgage application`,
        timestamp: app.created_at,
        icon: FileText,
        color: 'text-green-600'
      })

      if (app.completed) {
        newActivities.push({
          id: `app-completed-${app.id}`,
          type: 'application_updated', 
          title: 'Application Completed',
          description: `${fullName} completed their application`,
          timestamp: app.updated_at,
          icon: TrendingUp,
          color: 'text-blue-600'
        })
      }
    })

    // Add call activities
    callLogs.forEach(call => {
      if (call.started_at) {
        newActivities.push({
          id: `call-started-${call.id}`,
          type: 'call_started',
          title: 'Call Initiated',
          description: `Voice AI call started to ${call.phone_number || 'unknown number'}`,
          timestamp: call.started_at,
          icon: Phone,
          color: 'text-orange-600'
        })
      }

      if (call.status === 'completed' && call.ended_at) {
        newActivities.push({
          id: `call-completed-${call.id}`,
          type: 'call_completed',
          title: 'Call Completed',
          description: `Call to ${call.phone_number || 'unknown number'} completed successfully`,
          timestamp: call.ended_at,
          icon: Phone,
          color: 'text-green-600'
        })
      }
    })

    // Sort by timestamp (newest first)
    newActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setActivities(newActivities.slice(0, 50)) // Limit to 50 most recent
  }, [applications, callLogs])

  const toggleLiveUpdates = () => {
    setIsLive(!isLive)
  }

  const refreshActivities = () => {
    // Force re-render to show latest activities
    setActivities([...activities])
  }

  return (
    <div className="flex-1">
      <Header 
        title="Real-time Activity" 
        subtitle={`Monitoring ${activities.length} recent events`}
        actions={
          <div className="flex items-center space-x-2">
            <Button 
              variant={isLive ? "default" : "outline"} 
              size="sm"
              onClick={toggleLiveUpdates}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" onClick={refreshActivities}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter(a => a.type.startsWith('application')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Application events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter(a => a.type.startsWith('call')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Call events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">{isLive ? 'Live' : 'Paused'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity) => {
                  const IconComponent = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                <p className="text-sm">
                  Activities will appear here as users interact with your forms and voice AI calls are made.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Clock className="w-5 h-5 mr-2" />
              How to Generate Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <div className="space-y-2 text-sm">
              <p><strong>To see live activity updates:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to the Forms tab and click "Open Form"</li>
                <li>Fill out a test application with your phone number</li>
                <li>Submit the form to create an "Application Created" event</li>
                <li>Watch for "Call Initiated" events when voice AI starts calling</li>
                <li>See "Call Completed" events when calls finish</li>
              </ol>
              <p className="mt-3 text-xs bg-green-100 p-2 rounded">
                This page updates in real-time - no refresh needed!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}