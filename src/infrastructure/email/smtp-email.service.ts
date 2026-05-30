import nodemailer from "nodemailer";

import { env } from "../../config/env.ts";
import type { EmailService, SendEmailInput } from "./email.service.ts";

export class SmtpEmailService implements EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
  });

  async sendEmail(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: env.smtpFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}
