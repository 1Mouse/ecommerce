export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface EmailService {
  sendEmail(input: SendEmailInput): Promise<void>;
}
