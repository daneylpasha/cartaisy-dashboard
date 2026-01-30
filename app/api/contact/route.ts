import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { connectToDatabase } from '@/lib/db';
import { ContactSubmission } from '@/models/ContactSubmission';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const sanitizedData = {
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 100),
      subject: subject?.trim().slice(0, 200) || 'General Inquiry',
      message: message.trim().slice(0, 5000),
    };

    // Save to database
    await connectToDatabase();
    await ContactSubmission.create({
      ...sanitizedData,
      ipAddress: ip,
    });

    // Send emails via Resend
    if (resend) {
      // 1. Notification to team
      await resend.emails.send({
        from: 'Cartaisy Contact <noreply@cartaisy.com>',
        to: 'daniyal@rendernext.io',
        replyTo: sanitizedData.email,
        subject: `Contact Form: ${sanitizedData.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${sanitizedData.name}</p>
          <p><strong>Email:</strong> ${sanitizedData.email}</p>
          <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${sanitizedData.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Submitted at: ${new Date().toISOString()}
          </p>
        `,
      });

      // 2. Confirmation to visitor
      await resend.emails.send({
        from: 'Cartaisy <noreply@cartaisy.com>',
        to: sanitizedData.email,
        subject: 'Thank you for contacting Cartaisy',
        html: `
          <h2>Hi ${sanitizedData.name},</h2>
          <p>Thank you for reaching out to us! We've received your message and will get back to you within 24 hours.</p>
          <p><strong>Your message:</strong></p>
          <blockquote style="border-left: 3px solid #9333ea; padding-left: 12px; color: #555;">
            ${sanitizedData.message.replace(/\n/g, '<br>')}
          </blockquote>
          <p>Best regards,<br>The Cartaisy Team</p>
          <hr>
          <p style="color: #999; font-size: 12px;">
            This is an automated response. Please do not reply to this email.
          </p>
        `,
      });
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
