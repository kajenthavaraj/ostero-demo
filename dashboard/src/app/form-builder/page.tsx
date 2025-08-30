'use client'

import { useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  ExternalLink, 
  ArrowLeft,
  Wrench,
  Info
} from 'lucide-react'
import Link from 'next/link'

export default function FormBuilderPage() {
  return (
    <div className="flex-1">
      <Header 
        title="Form Builder" 
        subtitle="Create and customize application forms with drag-and-drop interface"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/forms">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Link>
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Form Builder Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="w-5 h-5 mr-2" />
                Form Builder Tool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access the full-featured drag-and-drop form builder to create custom application forms with conditional logic, file uploads, and more.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Drag-and-drop form designer</li>
                  <li>• Multi-page forms with conditional logic</li>
                  <li>• File upload components</li>
                  <li>• Custom validation rules</li>
                  <li>• Real-time preview</li>
                </ul>
              </div>

              <Button className="w-full" asChild>
                <Link href="/form-builder-app">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Form Builder
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Current Forms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your existing forms and view their submission data directly in the dashboard.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Mortgage Application</div>
                    <div className="text-sm text-muted-foreground">Multi-step mortgage form</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/forms">
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Forms
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Info className="w-5 h-5 mr-2" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-3">
              <p className="font-medium">To use the Form Builder:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>The form builder runs on a separate port (3001) for development</li>
                <li>Click "Open Form Builder" to access the drag-and-drop interface</li>
                <li>Create your forms with the visual editor</li>
                <li>Publish forms to make them available for submissions</li>
                <li>View submissions and analytics in this dashboard</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <p className="text-xs">
                  <strong>Development Note:</strong> The form builder is currently set up as a separate 
                  application. In production, this would be fully integrated into the dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">Templates</h3>
                <p className="text-sm text-muted-foreground mb-3">Start with pre-built templates</p>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Wrench className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">Custom Fields</h3>
                <p className="text-sm text-muted-foreground mb-3">Build custom components</p>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ExternalLink className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">Integrations</h3>
                <p className="text-sm text-muted-foreground mb-3">Connect with external APIs</p>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}