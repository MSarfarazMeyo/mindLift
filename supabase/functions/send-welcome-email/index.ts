import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { corsHeaders } from '../_shared/cors';

serve(async (req: any) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, name, goals } = await req.json();

    // Create email content
    const subject = `Welcome to MindLift, ${name}!`;
    const goalsSection = goals?.length
      ? `\nYour selected goals:\n${goals.map((goal: any) => `- ${goal}`).join('\n')}`
      : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3498db;">Welcome to MindLift!</h1>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for joining MindLift! We're excited to be part of your journey towards better mental health and well-being.</p>
        
        ${goals?.length ? `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Your Goals:</h3>
          <ul style="color: #34495e;">
            ${goals.map((goal: any) => `<li>${goal}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <h3 style="color: #2c3e50;">Getting Started:</h3>
        <ol style="color: #34495e;">
          <li>Complete your daily mood check-in</li>
          <li>Set up your notification preferences</li>
          <li>Explore the mindfulness exercises</li>
          <li>Track your progress in the achievements section</li>
        </ol>
        
        <p>Remember, your mental health journey is unique, and we're here to support you every step of the way.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #7f8c8d; font-size: 14px;">
            Best regards,<br>
            The Mindlift Team
          </p>
        </div>
      </div>
    `;

    // Initialize SMTP client
    const client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME')!,
      port: parseInt(Deno.env.get('SMTP_PORT')!),
      username: Deno.env.get('SMTP_USERNAME')!,
      password: Deno.env.get('SMTP_PASSWORD')!,
    });

    // Send email
    await client.send({
      from: Deno.env.get('SMTP_FROM')!,
      to: to,
      subject: subject,
      content: "Please view this email in HTML",
      html: htmlContent,
    });

    // Close connection
    await client.close();

    return new Response(
      JSON.stringify({ message: 'Welcome email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending welcome email:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to send welcome email',
        details: (error as Error).message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});