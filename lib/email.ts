import { supabase } from './supabase';

interface WelcomeEmailParams {
  to: string;
  name: string;
  goals?: string[];
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: Error | null;
  message?: string;
}

interface WelcomeEmailFunctionResponse {
  message: string;
  error?: string;
  details?: string;
}

export async function sendWelcomeEmail({ to, name, goals }: WelcomeEmailParams): Promise<EmailResponse> {
  if (!to || !name) {
    return {
      success: false,
      error: new Error('Email and name are required'),
      message: 'Missing required fields'
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke<WelcomeEmailFunctionResponse>('send-welcome-email', {
      body: {
        to,
        name,
        goals: goals || []
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log("to", to)
    console.log("name", name)
    console.log("goals", goals)
    console.log("send-email", data)

    async function sendWelcomeEmail() {
      try {
        // Your logic for sending the email
      } catch (error) {
        console.error('Error in sendWelcomeEmail:', error);
        throw error;
      }
    }
    if (!data) {
      return {
        success: false,
        error: new Error('No response from email function'),
        message: 'Failed to send welcome email'
      };
    }
    if (data.error || data.details) {
      const errorMessage = data.error || data.details || 'Failed to send welcome email';
      console.error('Error from email function:', errorMessage);
      return {
        success: false,
        error: new Error(errorMessage),
        message: errorMessage
      };
    }
    return {
      success: true,
      data,
      message: data.message || 'Welcome email sent successfully'
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
      message: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
}