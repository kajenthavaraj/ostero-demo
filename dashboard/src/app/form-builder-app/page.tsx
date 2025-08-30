'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus,
  Edit3, 
  Eye, 
  Trash2,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

// Mock data for now - in a real implementation this would come from the form builder API
const mockForms = [
  {
    id: '1',
    name: 'Mortgage Application Form',
    description: 'Complete mortgage loan application with multi-step flow',
    status: 'PUBLISHED',
    slug: 'mortgage-application',
    _count: { submissions: 5 },
    createdAt: '2025-08-28'
  }
]

export default function FormBuilderApp() {
  const [forms] = useState(mockForms)

  const handleCreateForm = () => {
    const name = prompt('Enter form name:')
    if (name?.trim()) {
      // In real implementation, create form via API
      console.log('Creating form:', name.trim())
    }
  }

  const handleDeleteForm = (form: any) => {
    if (confirm(`Are you sure you want to delete "${form.name}"?`)) {
      // In real implementation, delete form via API
      console.log('Deleting form:', form.id)
    }
  }

  return (
    <div className="flex-1">
      <Header 
        title="Form Builder" 
        subtitle="Create and manage your application forms with drag-and-drop interface"
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
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Form Builder</h2>
            <p className="text-gray-600">Create and manage your application forms</p>
          </div>
          <Button onClick={handleCreateForm} className="inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
        </div>

        {/* Forms Grid */}
        {forms && forms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms</h3>
              <p className="text-gray-500 mb-6">Get started by creating a new form.</p>
              <Button onClick={handleCreateForm} className="inline-flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {forms?.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {form.status} • {form._count?.submissions || 0} submissions
                        </p>
                      </div>
                    </div>
                  </div>
                  {form.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{form.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => console.log('Edit form:', form.id)}
                      className="flex-1"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {form.status === 'PUBLISHED' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => console.log('View form:', form.slug)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteForm(form)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Form Builder Features</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-3">
              <p className="font-medium">Available Form Components:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>• Text Input Fields</div>
                <div>• Multiple Choice</div>
                <div>• Long Text Areas</div>
                <div>• Single Selection</div>
                <div>• Email Validation</div>
                <div>• File Uploads</div>
                <div>• Phone Number</div>
                <div>• Date Picker</div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <p className="text-xs">
                  <strong>Coming Soon:</strong> Full drag-and-drop editor, conditional logic, 
                  multi-page forms, and advanced validation rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}