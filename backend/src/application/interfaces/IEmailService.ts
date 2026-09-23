export interface IEmailService {
  sendWelcomeEmail(to: string, displayName: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
  sendEmailVerificationEmail(to: string, verificationToken: string): Promise<void>;
}