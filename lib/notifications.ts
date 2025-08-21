import nodemailer from 'nodemailer';
import { securityMonitor } from './monitoring';

interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  priority?: 'high' | 'normal' | 'low';
}

class NotificationService {
  private static instance: NotificationService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async sendEmail({ to, subject, body, priority = 'normal' }: EmailConfig): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email notification (development):', { to, subject, body });
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html: body,
        priority: priority === 'high' ? 'high' : undefined,
      });

      securityMonitor.logSecurityEvent(
        'api',
        'send_notification',
        'success',
        { messageId: info.messageId }
      );

      return true;
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'api',
        'send_notification',
        'failure',
        error
      );
      return false;
    }
  }

  public async sendSecurityAlert(
    type: string,
    message: string,
    details?: any
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('Admin email not configured');
      return;
    }

    const htmlBody = `
      <h2>Security Alert: ${type}</h2>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Message:</strong> ${message}</p>
      ${details ? `<pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
      <p>Please check the security dashboard for more information.</p>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `[SECURITY ALERT] ${type}`,
      body: htmlBody,
      priority: 'high',
    });
  }
}

export const notificationService = NotificationService.getInstance();
