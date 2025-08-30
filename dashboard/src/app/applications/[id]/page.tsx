'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/database'
import { Application, CallLog } from '@/types'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  User,
  Building,
  Clock,
  Edit,
  Download,
  PhoneCall
} from 'lucide-react'
import { 
  calculateProgress, 
  formatRelativeTime, 
  formatPhoneNumber, 
  formatCurrency,
  getStatusVariant 
} from '@/lib/utils'
import { LiveTranscript } from '@/components/LiveTranscript'

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  const applicationId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Fetch application details
      const appResult = await db.getApplication(applicationId)
      if (appResult.success) {
        setApplication(appResult.data!)
      }
      
      // Fetch call logs for this application
      const callsResult = await db.getCallLogs({ 
        status: 'all', 
        dateRange: 'all', 
        applicationId 
      }, 50, 0)
      if (callsResult.success) {
        setCallLogs(callsResult.data || [])
      }
      
      setLoading(false)
    }

    fetchData()
  }, [applicationId])

  if (loading) {
    return (
      <div className="flex-1">
        <Header title="Loading..." subtitle="Fetching application details" />
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

  if (!application) {
    return (
      <div className="flex-1">
        <Header title="Application Not Found" subtitle="The requested application could not be found" />
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Application Not Found</h3>
                <p className="text-sm mb-4">The application with ID {applicationId} does not exist.</p>
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

  const progress = calculateProgress(application)
  const fullName = application.full_legal_name || 
    `${application.first_name || ''} ${application.last_name || ''}`.trim() || 
    'Unknown'

  return (
    <div className="flex-1">
      <Header 
        title={fullName}
        subtitle={`Application ID: ${application.id.slice(0, 8)}...`}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <PhoneCall className="w-4 h-4 mr-2" />
              Start Call
            </Button>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Status and Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={getStatusVariant(
                  application.completed ? 'completed' : 
                  progress > 50 ? 'in progress' : 'started'
                )}
              >
                {application.completed ? 'Completed' : 
                 progress > 50 ? 'In Progress' : 'Started'}
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {formatRelativeTime(application.updated_at)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Call Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {callLogs.length} calls
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <div className="text-sm">{application.first_name || 'Not provided'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <div className="text-sm">{application.last_name || 'Not provided'}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Legal Name</label>
                <div className="text-sm">{application.full_legal_name || 'Not provided'}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <div className="text-sm">{application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'Not provided'}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">What Looking To Do</label>
                <div className="text-sm">
                  <Badge variant="outline">{application.what_looking_to_do || 'Not specified'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{application.email || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{application.phone ? formatPhoneNumber(application.phone) : 'Not provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property & Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Property & Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Loan Amount Requested</label>
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{application.loan_amount_requested || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property Address</label>
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{application.property_address || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property Type</label>
                <div className="text-sm">{application.property_type || 'Not provided'}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property Value</label>
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{application.property_value || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mortgage Balance</label>
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{application.mortgage_balance || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property Use</label>
                <div className="text-sm">
                  <Badge variant="outline">{application.property_use || 'Not specified'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment & Income Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Employment & Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                <div className="text-sm">
                  <Badge variant="outline">{application.employment_type || 'Not specified'}</Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Annual Income</label>
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{application.annual_income || 'Not provided'}</span>
                </div>
              </div>
              
              {application.other_income_sources && Array.isArray(application.other_income_sources) && application.other_income_sources.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Other Income Sources</label>
                  <div className="mt-2 space-y-2">
                    {(application.other_income_sources as any[]).map((source: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">{source.description || 'Unnamed source'}</span>
                        <span className="text-sm font-medium">${source.amount || '0'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        {callLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call History ({callLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {callLogs.slice(0, 5).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div>
                        <div className="text-sm font-medium">
                          {formatPhoneNumber(call.phone_number || '')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : 'Duration unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                        {call.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {call.started_at ? formatRelativeTime(call.started_at) : 'Time unknown'}
                      </div>
                    </div>
                  </div>
                ))}
                {callLogs.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All {callLogs.length} Calls
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Transcript */}
        {callLogs.length > 0 && (
          <LiveTranscript 
            callId={callLogs[0]?.vapi_call_id} 
            applicationId={applicationId}
            autoRefresh={true}
            refreshInterval={3000}
          />
        )}

        {/* Application Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">Application ID</label>
                <div className="font-mono">{application.id}</div>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Created</label>
                <div>{formatRelativeTime(application.created_at)}</div>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Last Updated</label>
                <div>{formatRelativeTime(application.updated_at)}</div>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">Completion Status</label>
                <div>{application.completed ? 'Completed' : 'In Progress'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

