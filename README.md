# Ostero Demo - Lead Management & Voice AI Platform

A comprehensive lead management system that combines an intelligent voice AI application form experience with a powerful dashboard for monitoring and analytics. The platform integrates VAPI voice AI technology with modern web applications to create a seamless lead collection and management workflow.

## 🏗️ Architecture Overview

The platform consists of two main components that work together to provide a complete lead management solution:

### 📋 **Form App** - Lead Collection Frontend
A React-based application form that customers interact with to submit their information for mortgage applications and other lead generation purposes.

### 📊 **Dashboard** - Management & Analytics Backend  
A Next.js dashboard that provides real-time monitoring, management, and analytics for all collected leads and voice interactions.

---

## 📋 Form App

### **Purpose**
The Form App provides an intuitive, multi-step application form where prospective customers can submit their personal, financial, and property information for mortgage applications and other services.

### **Key Features**
- **🎯 Multi-step Application Form**: Progressive form with clear sections for personal info, property details, and financial information
- **💾 Auto-save Functionality**: Automatically saves progress to prevent data loss
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🔄 Real-time Validation**: Instant feedback and validation for form fields
- **📈 Progress Tracking**: Visual progress indicators showing completion status
- **🔗 Voice AI Integration**: Connects with VAPI for voice-assisted form completion
- **🗄️ Database Integration**: Stores data in Supabase with real-time sync

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **State Management**: React hooks and context
- **Validation**: Built-in form validation with error handling
- **Build Tool**: Vite for fast development and building

### **Core Components**
- **ApplicationForm.tsx**: Main multi-step form component with sections for:
  - Personal Information (Name, DOB, Contact Details)
  - Property & Loan Details (Address, Loan Amount, Property Value)
  - Employment & Financial Information (Income, Employment Type)
  - Additional Income Sources and Documentation

### **Voice Server Integration**
The Form App includes a sophisticated voice server built in Python that handles:
- **🎙️ VAPI Integration**: Receives and processes voice AI webhooks
- **📞 Call Management**: Automatic call completion detection and processing
- **📝 Transcript Processing**: Extracts and processes conversation data
- **🔄 Auto-fill Capabilities**: Automatically fills form fields from voice conversations
- **📊 Analytics Tracking**: Logs call performance and success metrics

---

## 📊 Dashboard

### **Purpose**
The Dashboard is a comprehensive management interface that provides real-time monitoring, analytics, and management capabilities for all leads, applications, and voice interactions generated through the Form App.

### **Key Features**

#### **📋 Application Management**
- **Real-time Application Tracking**: Live updates of all submitted applications
- **Detailed Application Views**: Comprehensive view of individual applications with progress indicators
- **Advanced Search & Filtering**: Filter by name, email, phone, status, date range, and lead source
- **Progress Visualization**: Visual completion percentages and status badges
- **Application Status Management**: Track applications from Started → In Progress → Completed

#### **📞 Call Monitoring & Analytics**
- **Live Call Log Tracking**: Real-time monitoring of all VAPI voice interactions
- **Call Transcripts & Summaries**: AI-powered insights and conversation analysis
- **Cost Tracking**: Detailed breakdown of call costs and performance metrics
- **Call Status Monitoring**: Track calls from Ringing → Completed → Failed
- **Duration & Cost Analytics**: Comprehensive performance and cost analysis

#### **📊 Analytics Dashboard**
- **Key Performance Indicators (KPIs)**: Time-based filtering (7d, 30d, 90d, all-time)
- **Conversion Rate Tracking**: Monitor conversion from voice calls to completed applications
- **Lead Source Analysis**: Performance breakdown by traffic source
- **Real-time Activity Feeds**: Live updates of recent applications and calls
- **Performance Trends**: Success rate metrics and trend analysis

#### **🔄 Real-time Updates**
- **Live Data Synchronization**: Powered by Supabase real-time subscriptions
- **Connection Status Indicator**: Shows real-time connectivity status
- **Automatic Data Refresh**: No page refresh required for data updates
- **Real-time Notifications**: Instant alerts for new applications and calls

### **Technology Stack**
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI Framework**: shadcn/ui component library with Tailwind CSS
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **State Management**: React Context API for real-time data management
- **Icons**: Lucide React icons
- **Deployment**: Optimized for Vercel deployment

### **Core Pages & Components**
- **Applications Management**: Complete CRUD operations for applications
- **Call Monitoring**: Real-time call logs with transcript viewing
- **Analytics Dashboard**: KPIs, conversion rates, and performance metrics
- **Live Transcript View**: Real-time call transcript monitoring
- **Activity Feeds**: Recent activity across all applications and calls

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (for voice server)
- Supabase account and project
- VAPI account (for voice AI features)

### 1. **Setup Form App**
```bash
cd form-app/frontend
npm install
npm run dev
```
The form will be available at `http://localhost:5173`

### 2. **Setup Dashboard**
```bash
cd dashboard
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`

### 3. **Setup Voice Server**
```bash
cd form-app/voice_server
pip install -r requirements.txt
python vapi_server.py
```
The voice webhook server will be available at `http://localhost:5001`

### 4. **Environment Configuration**
Each component requires environment variables. See individual README files for detailed configuration:
- `form-app/frontend/.env` - Supabase configuration
- `dashboard/.env.local` - Supabase and database configuration  
- `form-app/voice_server/.env` - VAPI API keys and webhook secrets

---

## 🔄 Workflow

1. **Lead Generation**: Customers access the Form App and begin filling out their application
2. **Voice Assistance**: Optional VAPI voice AI can assist customers in completing forms via phone calls
3. **Real-time Sync**: All data is automatically synced to Supabase database in real-time
4. **Dashboard Monitoring**: Staff monitor applications and calls through the Dashboard
5. **Analytics & Insights**: Performance metrics and conversion rates are tracked for optimization

---

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following core tables:
- **`applications`**: Stores all form submissions and application data
- **`call_logs`**: Tracks all VAPI voice interactions and transcripts
- **Real-time subscriptions**: Enable live updates across both applications

---

## 🔧 Key Integrations

- **🎙️ VAPI Voice AI**: Powers voice-assisted form completion and call management
- **🗄️ Supabase**: Real-time database with live subscriptions
- **📊 Analytics**: Custom analytics pipeline for performance tracking
- **🔄 Webhooks**: Real-time event processing between components

---

## 📈 Performance & Scalability

- **Real-time Architecture**: Built for live data updates and instant synchronization
- **Responsive Design**: Optimized for all device types and screen sizes
- **Efficient Data Loading**: Lazy loading and pagination for large datasets
- **Cost Optimization**: Efficient database queries and API call management

---

## 🛡️ Security Features

- **Environment Variables**: All sensitive data stored in environment variables
- **Webhook Validation**: VAPI webhook signature verification
- **Data Validation**: Comprehensive input validation and sanitization
- **Secure Database**: Row-level security policies in Supabase

---

## 📚 Documentation

For detailed technical documentation and setup instructions:
- **Form App**: See `form-app/frontend/README.md`
- **Dashboard**: See `dashboard/README.md`
- **Voice Server**: See `form-app/voice_server/README_VAPI_SERVER.md`

---

**Built with ❤️ using React, Next.js, Supabase, and VAPI Voice AI**
