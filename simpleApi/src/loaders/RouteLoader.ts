// Importa módulos para manipulação de caminhos e leitura de diretórios
import path from 'path'
import { readdirSync } from 'fs'

// Importa o modelo base de rotas
import RoutesModel from '../models/RoutesModel'

// Importa a interface do cliente que será usada por todo o sistema
import { ClientInterface } from '../utils/types'

// Diretório raiz onde ficam os arquivos de rota
const DIR_ROUTES = 'src/routes'

/**
 * Classe responsável por carregar dinamicamente todas as rotas da aplicação.
 */
export default class RouteLoader {
  /**
   * Nome do loader, útil para logging e identificação.
   */
  public name: string

  /**
   * Cliente principal da aplicação, contendo instâncias de app, log, rotas etc.
   */
  private client: ClientInterface

  /**
   * Construtor do RouteLoader.
   * @param client - Instância do cliente que implementa ClientInterface
   */
  constructor(client: ClientInterface) {
    this.client = client
    this.name = 'RouteLoader'
  }

  /**
   * Método público que inicia o processo de carregamento das rotas.
   * Encontra arquivos, registra as rotas e faz log de sucesso ou erro.
   */
  public async load(): Promise<void> {
    try {
      const routeFiles = await this.findRouteFiles(DIR_ROUTES) // Busca todos os arquivos de rota recursivamente
      await this.registerRoutes(routeFiles) // Registra cada rota
      this.client.LOG('All routes successfully loaded', this.name)
    } catch (error: any) {
      this.client.LOG_ERR(error.message, this.name, 'Loading Routes')
    }
  }

  /**
   * Busca todos os arquivos `.ts` em um diretório, recursivamente.
   * @param dirPath - Caminho da pasta onde estão os arquivos de rota
   * @returns Lista de caminhos absolutos dos arquivos encontrados
   */
  private async findRouteFiles(dirPath: string): Promise<string[]> {
    const files: string[] = []
    const folders = readdirSync(dirPath, { withFileTypes: true })

    for (const folder of folders) {
      const fullPath = path.join(dirPath, folder.name)
      if (folder.isDirectory()) {
        const subFiles = await this.findRouteFiles(fullPath)
        files.push(...subFiles)
      } else if (folder.isFile() && folder.name.endsWith('.ts')) {
        files.push(fullPath)
      }
    }

    return files
  }

  /**
   * Registra dinamicamente cada rota encontrada.
   * Verifica se a classe exportada herda de `RoutesModel` e a instancia com o `client`.
   * @param files - Lista de caminhos para os arquivos de rota
   */
  private async registerRoutes(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        const routePath = path.resolve(file)
        const routeModule = await import(routePath)
        const RouteClass = routeModule.default

        // Verifica se a classe importada herda de RoutesModel
        if (RouteClass.prototype instanceof RoutesModel) {
          // Instancia com valores padrão, pode ser sobrescrito dentro da classe
          const routeInstance = new RouteClass(this.client, {
            path: '/',
            name: 'Default Route',
            description: 'No Description',
          })

          if (routeInstance instanceof RoutesModel) {
            // Adiciona a rota ao client para manter referência
            this.client.routes.push(routeInstance)

            // Registra no Express app
            this.client.app.use(routeInstance.path, (req, res, next) => {
              routeInstance.run()
              next()
            })

            this.client.LOG(`Route loaded: ${routeInstance.path}`, this.name)
          } else {
            this.client.LOG_ERR(
              `Invalid route instance in file: ${file}`,
              this.name,
            )
          }
        } else {
          this.client.LOG_ERR(`Invalid route class in file: ${file}`, this.name)
        }
      } catch (error: any) {
        this.client.LOG_ERR(error.message, this.name, `FILE ${file}`)
      }
    }
  }
}
