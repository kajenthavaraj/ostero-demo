# Lead Management Dashboard

A comprehensive Next.js dashboard for managing lead applications, call monitoring, and analytics for the lead generation and management platform.

## Features

### 📋 Application Management
- **Real-time application tracking** with live updates
- **Detailed application views** with progress indicators
- **Search and filtering** by name, email, phone, or status
- **Progress visualization** showing completion percentages
- **Application status management** (Started, In Progress, Completed)

### 📞 Call Monitoring
- **Live call log tracking** with VAPI integration
- **Call transcripts and summaries** with AI-powered insights
- **Cost tracking** and performance metrics
- **Call status monitoring** (Ringing, Completed, Failed)
- **Duration and cost analytics**

### 📊 Analytics Dashboard
- **Key performance indicators** (KPIs) with time-based filtering
- **Conversion rate tracking** from voice calls to completed applications
- **Source breakdown** showing performance by lead source
- **Real-time activity feeds** showing recent applications and calls
- **Performance trends** and success rate metrics

### 🔄 Real-time Updates
- **Live data synchronization** using Supabase subscriptions
- **Connection status indicator** showing real-time connectivity
- **Automatic data refresh** for applications and call logs
- **Real-time notifications** for new applications and calls

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **State Management**: React Context API for real-time data
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React icons

## Project Structure

```
dashboard/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── applications/       # Application management pages
│   │   ├── calls/             # Call monitoring pages
│   │   ├── analytics/         # Analytics dashboard
│   │   └── layout.tsx         # Root layout with providers
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── layout/           # Layout components (Sidebar, Header)
│   │   └── ui/               # Reusable UI components
│   ├── contexts/             # React contexts
│   │   └── realtime-context.tsx  # Real-time data management
│   ├── lib/                  # Utility functions
│   │   ├── database.ts       # Database service layer
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript type definitions
│       └── index.ts          # Application types
├── public/                   # Static assets
├── .env.local.example       # Environment variables template
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Setup Instructions

### 1. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp .env.local.example .env.local
```

Set the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration
DATABASE_URL=your_database_connection_string
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Ensure your Supabase database has the required tables:
- `applications` table with application data
- `call_logs` table with VAPI call data

Refer to the migration files in the parent project for the complete schema.

### 4. Run the Application

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The dashboard will be available at `http://localhost:3000`.

## Core Components

### Database Service (`src/lib/database.ts`)
- Centralized database operations
- Application CRUD operations
- Call log management
- Analytics data aggregation
- Real-time subscription setup

### Real-time Context (`src/contexts/realtime-context.tsx`)
- Supabase real-time subscriptions
- Live data synchronization
- Connection status management
- Cross-component state sharing

### Application Management
- **ApplicationsTable**: Displays applications with sorting and filtering
- **Application Detail Page**: Comprehensive view of individual applications
- **Real-time updates**: Live application status changes

### Call Monitoring
- **CallsTable**: Call log display with transcript summaries
- **Call Detail Page**: Full call transcripts and performance metrics
- **Cost tracking**: VAPI call cost analysis

### Analytics Dashboard
- **Performance metrics**: KPIs and conversion rates
- **Time-based filtering**: 7d, 30d, 90d, and all-time views
- **Source analysis**: Lead source performance breakdown
- **Activity feeds**: Recent applications and calls

## Key Features in Detail

### Real-time Updates
The dashboard uses Supabase's real-time capabilities to provide live updates:
- New applications appear instantly
- Call status changes update in real-time
- Connection status indicator shows live connectivity
- No page refresh required for data updates

### Application Progress Tracking
Applications show completion progress based on filled fields:
- Personal information completeness
- Contact details verification
- Employment and financial data
- Visual progress bars and status badges

### Call Analytics
Comprehensive call monitoring includes:
- VAPI call integration
- Transcript summarization
- Cost per call tracking
- Performance metrics
- Success rate analysis

### Search and Filtering
Advanced filtering capabilities:
- Text search across all fields
- Status-based filtering
- Date range selection
- Source-based filtering

## API Integration

The dashboard integrates with:
- **Supabase Database**: Primary data storage and real-time subscriptions
- **VAPI**: Voice AI platform for call data
- **Backend Services**: Analytics and data processing services

## Development Guidelines

### Code Organization
- Components are organized by feature (dashboard, layout, ui)
- Shared utilities in `lib/` directory
- Type definitions centralized in `types/`
- Real-time state management through contexts

### Styling
- Tailwind CSS for styling
- shadcn/ui component library for consistency
- Custom CSS variables for theme colors
- Responsive design patterns

### Type Safety
- Full TypeScript implementation
- Comprehensive type definitions for all data models
- Type-safe database operations
- Proper error handling throughout

## Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `.next` directory to your hosting provider
3. Ensure environment variables are configured

## Monitoring and Analytics

The dashboard provides comprehensive monitoring:
- Application conversion rates
- Call success metrics
- Cost per acquisition tracking
- Real-time activity monitoring
- Performance trend analysis

## Support and Maintenance

### Logs and Debugging
- Browser console logs for real-time connection status
- Network tab for API call monitoring
- Supabase dashboard for database monitoring

### Performance Optimization
- Real-time subscriptions are optimized for minimal data transfer
- Components use React.memo for efficient re-rendering
- Database queries include proper indexing
- Lazy loading for large data sets

## Future Enhancements

Planned features for future releases:
- Advanced filtering and search capabilities
- Export functionality for reports and data
- Push notifications for critical events
- Advanced analytics and reporting
- Integration with additional communication platforms

---

For technical support or questions about the dashboard implementation, refer to the parent project's technical documentation in `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`.