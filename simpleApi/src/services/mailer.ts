import { resolve } from 'path'

import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import type { Transporter, SendMailOptions } from 'nodemailer'
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access'

/**
 * Tipos permitidos de níveis de log.
 */
type LoggerLevels = 'info'

/**
 * Interface para um logger simples com níveis de log.
 */
type Logger = {
  [Level in LoggerLevels]: (...messages: string[]) => void
}

/**
 * Logger de console simples para mensagens informativas.
 */
const logger: Logger = {
  info(...messages: string[]): void {
    console.log(messages.join('\n'))
  },
}

/**
 * Interface para opções de envio de e-mail, estendendo as opções padrão do nodemailer.
 * @property to - Destinatário(s) do e-mail.
 * @property template - Nome do template Handlebars usado (opcional).
 * @property context - Dados a serem passados para o template (opcional).
 */
interface IMailOptions extends SendMailOptions {
  to: string | string[]
  template?: string
  context?: object
}

/**
 * Classe responsável por configurar e enviar e-mails utilizando Nodemailer
 * e o mecanismo de template Handlebars.
 */
class Mailer {
  /**
   * Objeto de transporte do Nodemailer responsável por enviar os e-mails.
   */
  transporter: Transporter

  /**
   * Construtor da classe Mailer.
   * Cria e configura o transportador de e-mails, incluindo integração com templates Handlebars.
   */
  constructor() {
    // Cria o transporter usando o serviço do Gmail com autenticação via variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASS,
      },
    })

    // Configura o uso de templates Handlebars no envio dos e-mails
    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          defaultLayout: undefined,
          handlebars: allowInsecurePrototypeAccess(Handlebars), // Permite acesso a protótipos em templates
        },
        viewPath: resolve(__dirname, '..', 'views'), // Caminho dos templates de e-mail
        extName: '.hbs', // Extensão padrão dos arquivos de template
      }),
    )
  }

  /**
   * Envia um e-mail com base nas opções informadas.
   * Pode usar um template .hbs e dados de contexto se forem fornecidos.
   * @param options - Objeto com informações do e-mail como destinatário, assunto, template e contexto.
   * @returns Promessa resolvida após envio ou função de callback para lidar com erro.
   */
  sendMail(options: IMailOptions): any {
    return this.transporter.sendMail(
      {
        from: '', // Pode ser algo como "SeuNome <seuemail@gmail.com>"
        subject: '', // Assunto padrão (pode ser sobrescrito nas opções)
        ...options,
      },
      err => {
        if (err) return logger.info(err.message)
      },
    )
  }
}

/**
 * Exporta uma instância única da classe Mailer (singleton).
 * Pode ser importada diretamente para reutilizar o serviço de envio de e-mail.
 */
export default new Mailer()
