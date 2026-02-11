import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  async sendInvoice(to: string, subject: string, html: string, pdfBuffer: Buffer, filename: string) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })
  }
}
