'use client'

import { useParams } from 'next/navigation'
import { LiveTranscript } from '@/components/LiveTranscript'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TranscriptPage() {
  const params = useParams()
  const callId = params.call_id as string

  return (
    <div className="flex-1">
      <Header 
        title="Live Transcript" 
        subtitle={`Viewing call: ${callId?.slice(0, 8)}...`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        }
      />
      
      <div className="p-6">
        {callId ? (
          <LiveTranscript 
            callId={callId} 
            applicationId={""}
            autoRefresh={true}
            refreshInterval={3000}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Invalid call ID</p>
          </div>
        )}
      </div>
    </div>
  )
}