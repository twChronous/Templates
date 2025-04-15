import cors from 'cors'
import express, { Application } from 'express'

import Loaders from './loaders/index'
import { Users } from './database/models'
import { ClientInterface, RoutesModelOptions } from './utils/types'

/**
 * Opções de configuração do CORS.
 * - `origin`: Origem permitida, definida por variável de ambiente.
 * - `credentials`: Permite envio de cookies/autenticação.
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}

/**
 * Classe principal da aplicação que representa o servidor Express.
 * Implementa a interface `ClientInterface`.
 */
export default class Client implements ClientInterface {
  /**
   * Instância da aplicação Express.
   */
  public app: Application

  /**
   * Modelo de usuários da aplicação, importado dos modelos do banco de dados.
   */
  public users: typeof Users

  /**
   * Lista de configurações de rotas a serem usadas na aplicação.
   */
  public routes: RoutesModelOptions[]

  /**
   * Construtor da classe `Client`.
   * Inicializa a aplicação Express, o modelo de usuários e as configurações básicas (CORS e JSON).
   */
  constructor() {
    this.users = Users
    this.routes = []
    this.app = express()
    this.app.use(express.json())
    this.app.use(cors(corsOptions))
  }

  /**
   * Inicializa o servidor Express na porta especificada.
   * Também chama os carregadores (loaders) para inicializar módulos adicionais.
   * @param port - Porta na qual o servidor será iniciado.
   */
  public startServer(port: number): void {
    this.app.listen(port, () => {
      this.LOG(`http://localhost:${port}/`, 'App is running')
    })
    this.initializeLoaders()
  }

  /**
   * Inicializa os loaders do sistema, que são módulos responsáveis
   * por configurar partes específicas da aplicação, como banco de dados, autenticação, etc.
   * O método tenta carregar todos os loaders e loga o resultado.
   */
  private async initializeLoaders(): Promise<void> {
    // Obtém todos os loaders exportados dinamicamente
    const loaders: Array<typeof Loaders[keyof typeof Loaders]> = Object.values(Loaders)
    let loadedCount = 0

    for (const LoaderClass of loaders) {
      const loaderInstance = new LoaderClass(this)
      try {
        await loaderInstance.load()
        loadedCount++
      } catch (e) {
        // Loga erro ao carregar um loader específico
        this.LOG_ERR(
          e instanceof Error ? e.message : String(e),
          loaderInstance.name,
        )
      }
    }

    // Log de quantos módulos foram carregados com sucesso
    this.LOG(
      `Successfully loaded ${loadedCount} modules out of ${loaders.length}`,
      'LOADERS',
    )
  }

  /**
   * Mostra uma mensagem no console com formatação de cor.
   * Ideal para logs informativos.
   * @param args - Primeiro argumento é a mensagem principal. Demais argumentos são contextos/prefixos.
   */
  public LOG(...args: string[]): void {
    const Sendlog = `${
      args.length > 1
        ? `\x1b[32m${args
            .map(t => `[${t}]`)
            .slice(1)
            .join(' ')}\x1b[0m`
        : ''
    } \x1b[34m${args[0]}\x1b[0m`
    console.log(Sendlog)
  }

  /**
   * Mostra uma mensagem de erro no console com formatação de cor.
   * Ideal para logs de falha ou exceções.
   * @param args - Primeiro argumento é a mensagem de erro. Demais argumentos são contextos/prefixos.
   */
  public LOG_ERR(...args: string[]): void {
    const error = args[0]
    const Sendlog =
      args.length > 1 ? args.slice(1).map(t => `\x1b[33m[${t}]\x1b[0m`) : ''
    console.error('\x1b[31m[ERROR]\x1b[0m', ...Sendlog, error)
  }

  /**
   * Lança uma exceção formatada a partir de um erro qualquer.
   * @param err - Objeto de erro ou mensagem a ser lançada.
   */
  public Error(err: any): void {
    throw new Error(err.message ? err.message : String(err))
  }
}
