'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Application } from '@/types'
import { 
  calculateProgress, 
  formatRelativeTime, 
  getInitials,
  formatPhoneNumber,
  getStatusVariant 
} from '@/lib/utils'
import { MoreHorizontal, Phone, Mail, Eye } from 'lucide-react'

interface ApplicationsTableProps {
  applications: Application[]
  loading?: boolean
}

export function ApplicationsTable({ applications, loading }: ApplicationsTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!applications.length) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium mb-1">No applications found</h3>
          <p className="text-sm">Applications will appear here as they are created</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const progress = calculateProgress(application)
            const fullName = application.full_legal_name || 
              `${application.first_name || ''} ${application.last_name || ''}`.trim() ||
              'Unknown'
            
            return (
              <TableRow key={application.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {getInitials(application.first_name, application.last_name)}
                    </div>
                    <div>
                      <Link 
                        href={`/applications/${application.id}`}
                        className="font-medium hover:underline"
                      >
                        {fullName}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        ID: {application.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {application.email && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="w-3 h-3" />
                        <span>{application.email}</span>
                      </div>
                    )}
                    {application.phone && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{formatPhoneNumber(application.phone)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={getStatusVariant(
                      application.completed ? 'completed' : 
                      progress > 50 ? 'in progress' : 'started'
                    )}
                  >
                    {application.completed ? 'Completed' : 
                     progress > 50 ? 'In Progress' : 'Started'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={progress} className="w-16" />
                    <span className="text-sm text-muted-foreground w-10">
                      {progress}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {formatRelativeTime(application.updated_at)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline">
                    {/* Determine source based on call logs - for now default to Web */}
                    Web
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/applications/${application.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}