import { Injectable } from '@nestjs/common'
import puppeteer from 'puppeteer'

@Injectable()
export class PdfService {
  async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()
    return Buffer.from(buffer)
  }
}
