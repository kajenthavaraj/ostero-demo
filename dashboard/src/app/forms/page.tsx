'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  ExternalLink, 
  Eye, 
  Users, 
  Clock,
  Globe,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'

export default function FormsPage() {
  const forms = [
    {
      id: 'mortgage-application',
      name: 'Mortgage Application Form',
      description: 'Complete mortgage loan application with multi-step flow',
      url: 'http://localhost:8081', // Your form app URL
      status: 'active',
      submissions: 0, // Will be updated with real data
      lastModified: '2025-08-28',
      features: ['Multi-step form', 'Voice AI integration', 'Real-time validation', 'Auto-save progress']
    }
  ]

  const handleOpenForm = (url: string) => {
    window.open(url, '_blank')
  }

  const handleViewSubmissions = (formId: string) => {
    // Navigate to applications filtered by this form
    window.location.href = '/applications'
  }

  return (
    <div className="flex-1">
      <Header 
        title="Forms Management" 
        subtitle="Manage and monitor your application forms"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/form-builder">
                <FileText className="w-4 h-4 mr-2" />
                Form Builder
              </Link>
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.filter(f => f.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {forms.reduce((sum, form) => sum + form.submissions, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all forms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Average completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voice Integration</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-muted-foreground">
                AI calling enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Forms</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                        {form.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Form Features */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {form.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Form Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Submissions</div>
                      <div className="text-lg font-semibold">{form.submissions}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Last Modified</div>
                      <div className="text-lg font-semibold">{form.lastModified}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Status</div>
                      <div className="text-lg font-semibold capitalize">{form.status}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Button 
                      onClick={() => handleOpenForm(form.url)}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Form
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewSubmissions(form.id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testing Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Globe className="w-5 h-5 mr-2" />
              Testing the Complete Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-3">
              <p className="font-medium">To test the complete application flow:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Open Form" to access the mortgage application form</li>
                <li>Fill out the application as a test user with your phone number</li>
                <li>Submit the form to trigger the voice AI system</li>
                <li>Return to this dashboard to see the new application appear in real-time</li>
                <li>Monitor call logs for the automated follow-up calls</li>
                <li>Watch analytics update with new conversion data</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <p className="text-xs">
                  <strong>Tip:</strong> Keep this dashboard open in one tab and the form in another 
                  to see real-time updates as you complete the application process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}