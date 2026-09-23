import nodemailer from 'nodemailer';
import { env } from '../../config-middleware/config/env.js';
import { IEmailService } from '../../../application/interfaces/IEmailService.js';

export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Culinary Blog</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Welcome to Culinary Blog! 🍳</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>${displayName}</strong>,</p>
            <p>Thank you for joining Culinary Blog! We're excited to have you as part of our community of food lovers.</p>
            <p>Here's what you can do now:</p>
            <ul>
              <li>📝 Create and share your own recipes</li>
              <li>🔍 Discover amazing recipes from other cooks</li>
              <li>💾 Save your favorite recipes</li>
              <li>🏷️ Explore recipes by category</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/recipes/new" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Create Your First Recipe
              </a>
            </p>
            <p>Happy cooking!</p>
            <p>The Culinary Blog Team</p>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Welcome to Culinary Blog! 🍳',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Reset Your Password - Culinary Blog',
      html,
    });
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up! Please verify your email address:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Verify Your Email - Culinary Blog',
      html,
    });
  }
}