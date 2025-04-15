import { resolve } from 'path'

import nodemailer from 'nodemailer'
import Handlebars from 'handlebars'
import hbs from 'nodemailer-express-handlebars'
import type { Transporter, SendMailOptions } from 'nodemailer'
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access'

type LoggerLevels = 'info'

type Logger = {
  [Level in LoggerLevels]: (...messages: string[]) => void
}

const logger: Logger = {
  info(...messages: string[]): void {
    console.log(messages.join('\n'))
  },
}

interface IMailOptions extends SendMailOptions {
  to: string | string[]
  template?: string
  context?: object
}

class Mailer {
  transporter: Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASS,
      },
    })

    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          defaultLayout: undefined,
          handlebars: allowInsecurePrototypeAccess(Handlebars),
        },
        viewPath: resolve(__dirname, '..', 'views'),
        extName: '.hbs',
      }),
    )
  }

  sendMail(options: IMailOptions): any {
    return this.transporter.sendMail(
      {
        from: '', // Nome <email>
        subject: '', // Assunto
        ...options,
      },
      err => {
        if (err) return logger.info(err.message)
      },
    )
  }
}

export default new Mailer()
