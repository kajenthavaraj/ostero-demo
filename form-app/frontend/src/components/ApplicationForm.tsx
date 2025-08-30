import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Minus, Save, CheckCircle, AlertCircle, Mail, Phone, User, Building, Home, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OtherIncomeSource {
  description: string;
  amount: string;
}

interface ApplicationData {
  id?: string;
  secret_key?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_legal_name: string;
  date_of_birth?: Date;
  marital_status: string;
  what_looking_to_do: string;
  loan_amount_requested: string;
  property_address: string;
  property_type: string;
  property_value: string;
  mortgage_balance: string;
  property_use: string;
  employment_type: string;
  annual_income: string;
  other_income_sources: OtherIncomeSource[];
}

const sections = [
  {
    title: "Personal Information",
    icon: User,
    active: false
  },
  {
    title: "Property & Loan Details",
    icon: Home,
    active: false
  },
  {
    title: "Employment & Income", 
    icon: Building,
    active: false
  }
];

const pages = [
  {
    title: "Personal Information",
    description: "Tell us more about yourself"
  },
  {
    title: "Property & Loan Details",
    description: "Information about your property and loan"
  },
  {
    title: "Employment & Income",
    description: "Your employment and financial information"
  }
];

const ApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [showPreApplication, setShowPreApplication] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isApplyingExternalUpdate, setIsApplyingExternalUpdate] = useState(false);
  const [data, setData] = useState<ApplicationData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    full_legal_name: '',
    date_of_birth: undefined,
    marital_status: '',
    what_looking_to_do: '',
    loan_amount_requested: '',
    property_address: '',
    property_type: '',
    property_value: '',
    mortgage_balance: '',
    property_use: '',
    employment_type: '',
    annual_income: '',
    other_income_sources: []
  });

  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [dateYear, setDateYear] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Phone number formatting function
  const formatPhoneToE164 = (phone: string): string => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If it's already 11 digits and starts with 1, it's likely US/Canada format
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    
    // If it's 10 digits, assume US/Canada and add +1
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // If it already starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: assume US/Canada and add +1
    return `+1${digitsOnly}`;
  };

  // Call dispatch function
  const triggerCallDispatch = async (applicationId: string, formData: ApplicationData): Promise<boolean> => {
    try {
      console.log('🎯 Triggering call dispatch for application:', applicationId);
      
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneToE164(formData.phone);
      console.log(`📞 Phone formatting: ${formData.phone} → ${formattedPhone}`);
      
      const response = await fetch('http://localhost:5001/api/trigger-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formattedPhone,
          email: formData.email
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Call dispatch successful:', result);
        toast({
          title: "Call Initiated! 📞",
          description: "You will receive a call shortly to continue your application. Please answer when we call!",
          duration: 8000,
        });
        return true;
      } else {
        console.error('❌ Call dispatch failed:', result);
        // Don't show error to user for now, as the application was still created successfully
        // Just log the error and continue with normal flow
        return false;
      }
    } catch (error) {
      console.error('❌ Error triggering call dispatch:', error);
      // Don't show error to user for now, as the application was still created successfully
      return false;
    }
  };

  // Load existing application if ID is present in URL
  useEffect(() => {
    const loadApplication = async () => {
      if (id) {
        try {
          const { data: application, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error loading application:', error);
            toast({
              title: "Error",
              description: "Failed to load application. Please check the URL.",
              variant: "destructive"
            });
            return;
          }

          if (application) {
            setApplicationId(application.id);
            setShowPreApplication(false);
            setCurrentPage(application.current_step || 0);
            
            // Parse date_of_birth if it exists
            let parsedDateOfBirth;
            if (application.date_of_birth) {
              parsedDateOfBirth = new Date(application.date_of_birth);
              setDateMonth((parsedDateOfBirth.getMonth() + 1).toString().padStart(2, '0'));
              setDateDay(parsedDateOfBirth.getDate().toString().padStart(2, '0'));
              setDateYear(parsedDateOfBirth.getFullYear().toString());
            }

            setData({
              id: application.id,
              secret_key: application.secret_key || '',
              first_name: application.first_name || '',
              last_name: application.last_name || '',
              email: application.email || '',
              phone: application.phone || '',
              full_legal_name: application.full_legal_name || '',
              date_of_birth: parsedDateOfBirth,
              marital_status: application.marital_status || '',
              what_looking_to_do: application.what_looking_to_do || '',
              loan_amount_requested: application.loan_amount_requested || '',
              property_address: application.property_address || '',
              property_type: application.property_type || '',
              property_value: application.property_value || '',
              mortgage_balance: application.mortgage_balance || '',
              property_use: application.property_use || '',
              employment_type: application.employment_type || '',
              annual_income: application.annual_income || '',
              other_income_sources: (application.other_income_sources as unknown as OtherIncomeSource[]) || []
            });

            toast({
              title: "Application Loaded",
              description: "Your application has been loaded successfully!",
            });
          }
        } catch (error) {
          console.error('Error loading application:', error);
          toast({
            title: "Error",
            description: "Failed to load application. Please try again.",
            variant: "destructive"
          });
        }
      }
    };

    loadApplication();
  }, [id, toast]);

  // Set up real-time subscription for the current application
  useEffect(() => {
    if (!applicationId) return;

    console.log('Setting up real-time subscription for application:', applicationId);
    
    const channel = supabase
      .channel(`application-${applicationId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          const updatedApplication = payload.new;
          
          // Set flag to prevent auto-save conflicts
          setIsApplyingExternalUpdate(true);
          
          // Parse date_of_birth if it exists
          let parsedDateOfBirth;
          if (updatedApplication.date_of_birth) {
            parsedDateOfBirth = new Date(updatedApplication.date_of_birth);
            setDateMonth((parsedDateOfBirth.getMonth() + 1).toString().padStart(2, '0'));
            setDateDay(parsedDateOfBirth.getDate().toString().padStart(2, '0'));
            setDateYear(parsedDateOfBirth.getFullYear().toString());
          }

          // Update local state with new data from database
          setData({
            id: updatedApplication.id,
            secret_key: updatedApplication.secret_key || '',
            first_name: updatedApplication.first_name || '',
            last_name: updatedApplication.last_name || '',
            email: updatedApplication.email || '',
            phone: updatedApplication.phone || '',
            full_legal_name: updatedApplication.full_legal_name || '',
            date_of_birth: parsedDateOfBirth,
            marital_status: updatedApplication.marital_status || '',
            what_looking_to_do: updatedApplication.what_looking_to_do || '',
            loan_amount_requested: updatedApplication.loan_amount_requested || '',
            property_address: updatedApplication.property_address || '',
            property_type: updatedApplication.property_type || '',
            property_value: updatedApplication.property_value || '',
            mortgage_balance: updatedApplication.mortgage_balance || '',
            property_use: updatedApplication.property_use || '',
            employment_type: updatedApplication.employment_type || '',
            annual_income: updatedApplication.annual_income || '',
            other_income_sources: (updatedApplication.other_income_sources as unknown as OtherIncomeSource[]) || []
          });

          // Update current page if it was changed
          if (updatedApplication.current_step !== undefined) {
            setCurrentPage(updatedApplication.current_step);
          }

          // Show completion status if application was completed
          if (updatedApplication.completed && !showThankYou) {
            setShowThankYou(true);
          }

          // Reset flag after a short delay
          setTimeout(() => {
            setIsApplyingExternalUpdate(false);
          }, 100);

          toast({
            title: "Application Updated",
            description: "Your application was updated from another source.",
          });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
          toast({
            title: "Connection Error",
            description: "Real-time updates may not work properly.",
            variant: "destructive"
          });
        }
      });

    // Cleanup subscription on unmount or when applicationId changes
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [applicationId, showThankYou, toast]);

  // Validation functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\(]?[\d]{3}[\)]?[\s\-\.]?[\d]{3}[\s\-\.]?[\d]{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const validateCurrentPage = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (showPreApplication) {
      if (!data.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!data.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!data.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!isValidEmail(data.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!data.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!isValidPhone(data.phone)) {
        newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
      }
    } else {
      // Validate other pages as needed
      if (currentPage === 0) {
        if (!data.full_legal_name.trim()) newErrors.full_legal_name = 'Full legal name is required';
        if (!isValidEmail(data.email)) newErrors.email = 'Please enter a valid email address';
        if (!isValidPhone(data.phone)) newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update date_of_birth when individual date components change
  useEffect(() => {
    if (dateMonth && dateDay && dateYear) {
      const date = new Date(parseInt(dateYear), parseInt(dateMonth) - 1, parseInt(dateDay));
      updateData('date_of_birth', date);
    }
  }, [dateMonth, dateDay, dateYear]);

  // Autosave function with debouncing
  const autoSave = useCallback(async (formData: ApplicationData) => {
    if (!applicationId || showPreApplication || isApplyingExternalUpdate) return;
    
    setSaveStatus('saving');
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          full_legal_name: formData.full_legal_name || null,
          date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : null,
          what_looking_to_do: formData.what_looking_to_do || null,
          loan_amount_requested: formData.loan_amount_requested || null,
          property_address: formData.property_address || null,
          property_type: formData.property_type || null,
          property_value: formData.property_value || null,
          mortgage_balance: formData.mortgage_balance || null,
          property_use: formData.property_use || null,
          employment_type: formData.employment_type || null,
          annual_income: formData.annual_income || null,
          other_income_sources: formData.other_income_sources as any || [],
          current_step: currentPage,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error auto-saving:', error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
      setSaveStatus('error');
    }
  }, [applicationId, showPreApplication, currentPage, isApplyingExternalUpdate]);

  const updateData = (field: keyof ApplicationData, value: any) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-populate Full Legal Name when First Name or Last Name changes
      if (field === 'first_name' || field === 'last_name') {
        const firstName = field === 'first_name' ? value : prev.first_name;
        const lastName = field === 'last_name' ? value : prev.last_name;
        if (firstName && lastName) {
          updated.full_legal_name = `${firstName} ${lastName}`;
        }
      }
      
      // Trigger autosave with debouncing
      if (!showPreApplication && applicationId) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          autoSave(updated);
        }, 1000);
      }
      
      return updated;
    });
  };

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    if (!cleanValue) return '';
    const num = parseInt(cleanValue);
    return num.toLocaleString();
  };

  const generateSecretKey = (): string => {
    // Generate a secure random key using crypto API
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    crypto.getRandomValues(array);
    // Convert to base64 and make it URL-safe
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const handleCurrencyChange = (field: keyof ApplicationData, value: string) => {
    const formatted = formatCurrency(value);
    updateData(field, formatted);
  };

  const addIncomeSource = () => {
    const newSources = [...data.other_income_sources, { description: '', amount: '' }];
    updateData('other_income_sources', newSources);
  };

  const removeIncomeSource = (index: number) => {
    const newSources = data.other_income_sources.filter((_, i) => i !== index);
    updateData('other_income_sources', newSources);
  };

  const updateIncomeSource = (index: number, field: 'description' | 'amount', value: string) => {
    const newSources = [...data.other_income_sources];
    if (field === 'amount') {
      newSources[index][field] = formatCurrency(value);
    } else {
      newSources[index][field] = value;
    }
    updateData('other_income_sources', newSources);
  };

  const handlePreApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentPage()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing.",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Add secret_key back once database migration is applied
      // const secretKey = generateSecretKey();
      // console.log('Generated secret key for application:', secretKey);
      
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          full_legal_name: `${data.first_name} ${data.last_name}`,
          // secret_key: secretKey, // TODO: Uncomment after migration
          current_step: 0
        })
        .select()
        .single();

      if (error) throw error;

      setApplicationId(application.id);
      updateData('full_legal_name', `${data.first_name} ${data.last_name}`);
      setShowPreApplication(false);
      
      // 🎯 TRIGGER AUTOMATIC CALL DISPATCH
      // This will initiate a call to the user to continue filling out their application
      await triggerCallDispatch(application.id, data);
      
      // Navigate to application URL
      navigate(`/application/${application.id}`);
      
      toast({
        title: "Application Started",
        description: "Your application has been created successfully!",
      });
    } catch (error) {
      console.error('Error creating application:', error);
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextPage = () => {
    if (!validateCurrentPage()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const completeApplication = async () => {
    if (!areAllRequiredFieldsFilled()) {
      toast({
        title: "Incomplete Application",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the application as completed in the database
      const { error } = await supabase
        .from('applications')
        .update({
          current_step: pages.length,
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error completing application:', error);
        toast({
          title: "Error",
          description: "Failed to complete application. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setShowThankYou(true);
      
      toast({
        title: "Application Completed!",
        description: "Your application has been successfully submitted.",
      });
    } catch (error) {
      console.error('Error completing application:', error);
      toast({
        title: "Error",
        description: "Failed to complete application. Please try again.",
        variant: "destructive"
      });
    }
  };


  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Save className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Error saving';
      default:
        return '';
    }
  };

  const getFilledQuestionsCount = () => {
    let filledCount = 0;
    const totalQuestions = 12; // Total number of main questions
    
    // Count filled fields
    if (data.full_legal_name?.trim()) filledCount++;
    if (data.email?.trim()) filledCount++;
    if (data.phone?.trim()) filledCount++;
    if (data.date_of_birth) filledCount++;
    if (data.what_looking_to_do?.trim()) filledCount++;
    if (data.loan_amount_requested?.trim()) filledCount++;
    if (data.property_address?.trim()) filledCount++;
    if (data.property_value?.trim()) filledCount++;
    if (data.mortgage_balance?.trim()) filledCount++;
    if (data.property_use?.trim()) filledCount++;
    if (data.employment_type?.trim()) filledCount++;
    if (data.annual_income?.trim()) filledCount++;
    
    return { filledCount, totalQuestions };
  };

  const areAllRequiredFieldsFilled = () => {
    return (
      data.full_legal_name?.trim() &&
      data.email?.trim() &&
      data.phone?.trim() &&
      data.date_of_birth &&
      data.what_looking_to_do?.trim() &&
      data.loan_amount_requested?.trim() &&
      data.property_address?.trim() &&
      data.property_value?.trim() &&
      data.mortgage_balance?.trim() &&
      data.property_use?.trim() &&
      data.employment_type?.trim() &&
      data.annual_income?.trim()
    );
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-4 text-green-700">Thank You!</h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Your mortgage application has been successfully submitted.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-3">What happens next?</h2>
                <div className="text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      Your mortgage agent will review your application within 24-48 hours
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      You will receive a call or email to discuss your application details
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      Additional documentation may be requested to complete your application
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Application ID: {applicationId}
                </p>
                <Button
                  onClick={() => {
                    setShowThankYou(false);
                    setShowPreApplication(true);
                    setCurrentPage(0);
                    setApplicationId(null);
                    setData({
                      first_name: '',
                      last_name: '',
                      email: '',
                      phone: '',
                      full_legal_name: '',
                      date_of_birth: undefined,
                      marital_status: '',
                      what_looking_to_do: '',
                      loan_amount_requested: '',
                      property_address: '',
                      property_type: '',
                      property_value: '',
                      mortgage_balance: '',
                      property_use: '',
                      employment_type: '',
                      annual_income: '',
                      other_income_sources: []
                    });
                  }}
                  variant="outline"
                >
                  Start New Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showPreApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Get Started</h1>
            <p className="text-xl text-muted-foreground">
              Let's begin with some basic information about you
            </p>
          </div>

          <Card className="border-2">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                <p className="text-muted-foreground">
                  Please provide your contact details to get started
                </p>
              </div>

              <form onSubmit={handlePreApplicationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-base font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={data.first_name}
                      onChange={(e) => {
                        updateData('first_name', e.target.value);
                        if (errors.first_name) {
                          setErrors(prev => ({ ...prev, first_name: '' }));
                        }
                      }}
                      placeholder="Enter your first name"
                      className={cn("mt-2 h-12", errors.first_name && "border-destructive")}
                      required
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name" className="text-base font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={data.last_name}
                      onChange={(e) => {
                        updateData('last_name', e.target.value);
                        if (errors.last_name) {
                          setErrors(prev => ({ ...prev, last_name: '' }));
                        }
                      }}
                      placeholder="Enter your last name"
                      className={cn("mt-2 h-12", errors.last_name && "border-destructive")}
                      required
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => {
                        updateData('email', e.target.value);
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="your.email@example.com"
                      className={cn("pl-11 h-12", errors.email && "border-destructive")}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={data.phone}
                      onChange={(e) => {
                        updateData('phone', e.target.value);
                        if (errors.phone) {
                          setErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      placeholder="4167009468 or (416) 700-9468"
                      className={cn("pl-11 h-12", errors.phone && "border-destructive")}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll call this number to continue your application
                  </p>
                </div>
                
                <Button type="submit" className="w-full h-12 text-base font-medium mt-8">
                  Continue Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 0: // Getting Started
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="full_legal_name">Full Legal Name</Label>
              <Input
                id="full_legal_name"
                value={data.full_legal_name}
                onChange={(e) => updateData('full_legal_name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="email_display">Email Address</Label>
              <Input
                id="email_display"
                value={data.email}
                onChange={(e) => {
                  updateData('email', e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={cn("mt-2", errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone_display">Phone Number</Label>
              <Input
                id="phone_display"
                value={data.phone}
                onChange={(e) => {
                  updateData('phone', e.target.value);
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                className={cn("mt-2", errors.phone && "border-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>
            
            <div>
              <Label>Date of Birth</Label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Month</Label>
                  <Select
                    value={dateMonth}
                    onValueChange={setDateMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">January</SelectItem>
                      <SelectItem value="02">February</SelectItem>
                      <SelectItem value="03">March</SelectItem>
                      <SelectItem value="04">April</SelectItem>
                      <SelectItem value="05">May</SelectItem>
                      <SelectItem value="06">June</SelectItem>
                      <SelectItem value="07">July</SelectItem>
                      <SelectItem value="08">August</SelectItem>
                      <SelectItem value="09">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Day</Label>
                  <Select
                    value={dateDay}
                    onValueChange={setDateDay}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = (i + 1).toString();
                        return (
                          <SelectItem key={day} value={day.padStart(2, '0')}>
                            {day}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Select
                    value={dateYear}
                    onValueChange={setDateYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                        const year = (new Date().getFullYear() - i).toString();
                        return (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <Label>What are you looking to do</Label>
              <div className="mt-2 space-y-2">
                {['Purchase', 'Refinance', 'Renewal'].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={option}
                      checked={data.what_looking_to_do === option}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateData('what_looking_to_do', option);
                        } else {
                          updateData('what_looking_to_do', '');
                        }
                      }}
                      className="h-5 w-5 rounded border-border"
                    />
                    <Label htmlFor={option} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Property & Loan Details
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="loan_amount_requested">Loan Amount Requested</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="loan_amount_requested"
                  value={data.loan_amount_requested}
                  onChange={(e) => handleCurrencyChange('loan_amount_requested', e.target.value)}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="property_address">Enter your property address</Label>
              <Input
                id="property_address"
                value={data.property_address}
                onChange={(e) => updateData('property_address', e.target.value)}
                className="mt-2"
                placeholder="123, Main St, City, Province"
              />
            </div>
            
            <div>
              <Label htmlFor="property_value">What is the value of your property</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="property_value"
                  value={data.property_value}
                  onChange={(e) => handleCurrencyChange('property_value', e.target.value)}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="mortgage_balance">What is your mortgage balance</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="mortgage_balance"
                  value={data.mortgage_balance}
                  onChange={(e) => handleCurrencyChange('mortgage_balance', e.target.value)}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="property_use">How is this property used?</Label>
              <Select
                value={data.property_use}
                onValueChange={(value) => updateData('property_use', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I live in it">I live in it</SelectItem>
                  <SelectItem value="Second home">Second home</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2: // Employment & Income
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="employment_type">What is your employment type</Label>
              <Select
                value={data.employment_type}
                onValueChange={(value) => updateData('employment_type', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Self employed">Self employed</SelectItem>
                  <SelectItem value="Pension">Pension</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="annual_income">What is your annual income?</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="annual_income"
                  value={data.annual_income}
                  onChange={(e) => handleCurrencyChange('annual_income', e.target.value)}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label>Do you have any other sources of income?</Label>
              <div className="mt-2 space-y-3">
                {data.other_income_sources.map((source, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-sm">Income Source</Label>
                      <Input
                        value={source.description}
                        onChange={(e) => updateIncomeSource(index, 'description', e.target.value)}
                        placeholder="Income source description"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          value={source.amount}
                          onChange={(e) => updateIncomeSource(index, 'amount', e.target.value)}
                          className="pl-8"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeIncomeSource(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIncomeSource}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income Source
                </Button>
              </div>
            </div>
            
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Mortgage Application</h1>
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1">
                {getSaveStatusIcon()}
                <span className="text-sm text-muted-foreground">{getSaveStatusText()}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Complete your mortgage application in a few simple steps
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-muted-foreground">Step {currentPage + 1} of {pages.length}</span>
          <span className="text-sm text-muted-foreground">
            {(() => {
              const { filledCount, totalQuestions } = getFilledQuestionsCount();
              return `${Math.round((filledCount / totalQuestions) * 100)}% Complete (${filledCount}/${totalQuestions} questions)`;
            })()}
          </span>
        </div>
        <Progress value={(() => {
          const { filledCount, totalQuestions } = getFilledQuestionsCount();
          return (filledCount / totalQuestions) * 100;
        })()} className="h-2 mb-8" />

        {/* Section Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            const isActive = index === currentPage;
            const isCompleted = index < currentPage;
            return (
              <div
                key={section.title}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : isCompleted
                    ? "bg-muted border-muted-foreground/20 text-muted-foreground"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{section.title}</span>
              </div>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{pages[currentPage].title}</h2>
              <p className="text-muted-foreground">{pages[currentPage].description}</p>
            </div>
            
            {renderPage()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              
              {currentPage === pages.length - 1 ? (
                <Button
                  onClick={completeApplication}
                  disabled={!areAllRequiredFieldsFilled()}
                >
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={nextPage}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationForm;