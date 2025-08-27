// Only import nodemailer on server-side
let nodemailer: any = null;
if (typeof window === 'undefined') {
  nodemailer = require('nodemailer');
}

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationOptions {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: any | null = null;

  private constructor() {
    this.initializeEmailTransporter();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeEmailTransporter(): Promise<void> {
    try {
      if (!nodemailer) {
        console.warn('Nodemailer not available (client-side). Email notifications will be logged only.');
        return;
      }
      
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        // Verify connection
        if (this.emailTransporter) {
          await this.emailTransporter.verify();
          console.log('Email transporter initialized successfully');
        }
      } else {
        console.warn('Email configuration missing. Email notifications will be logged only.');
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.emailTransporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (this.emailTransporter) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@yumzoom.com',
          to: options.to,
          subject: options.subject,
          html: options.body,
          priority: options.priority || 'normal',
        };

        await this.emailTransporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
      } else {
        // Log email instead of sending when transporter is not available
        console.log('Email notification (would be sent):', {
          to: options.to,
          subject: options.subject,
          priority: options.priority,
          body: options.body.substring(0, 100) + '...',
        });
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    try {
      switch (options.type) {
        case 'email':
          await this.sendEmail({
            to: options.recipient,
            subject: options.title,
            body: options.message,
            priority: options.priority,
          });
          break;

        case 'sms':
          // SMS implementation would go here
          console.log('SMS notification (not implemented):', {
            to: options.recipient,
            title: options.title,
            message: options.message,
          });
          break;

        case 'push':
          // Push notification implementation would go here
          console.log('Push notification (not implemented):', {
            to: options.recipient,
            title: options.title,
            message: options.message,
          });
          break;

        default:
          console.warn('Unknown notification type:', options.type);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    const promises = emails.map(email => this.sendEmail(email));
    await Promise.allSettled(promises);
  }

  async sendSecurityAlert(
    email: string,
    alertType: string,
    details: Record<string, any>
  ): Promise<void> {
    const subject = `Security Alert: ${alertType}`;
    const body = `
      <h2>Security Alert</h2>
      <p><strong>Alert Type:</strong> ${alertType}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Details:</strong></p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
      <p>If this was not you, please contact support immediately.</p>
    `;

    await this.sendEmail({
      to: email,
      subject,
      body,
      priority: 'high',
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to YumZoom!';
    const body = `
      <h2>Welcome to YumZoom, ${name}!</h2>
      <p>Thank you for joining our family restaurant rating platform.</p>
      <p>You can now:</p>
      <ul>
        <li>Discover and rate restaurants</li>
        <li>Create family profiles</li>
        <li>Track your dining experiences</li>
        <li>Connect with other families</li>
      </ul>
      <p>Get started by exploring restaurants in your area!</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/restaurants">Browse Restaurants</a></p>
    `;

    await this.sendEmail({
      to: email,
      subject,
      body,
      priority: 'normal',
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const subject = 'Password Reset Request';
    const body = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for your YumZoom account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await this.sendEmail({
      to: email,
      subject,
      body,
      priority: 'high',
    });
  }
}

export const notificationService = NotificationService.getInstance();