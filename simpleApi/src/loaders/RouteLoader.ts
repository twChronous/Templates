import { readdirSync } from 'fs'
import path from 'path'

import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'

const DIR_ROUTES = 'src/routes'

export default class RouteLoader {
  public name: string

  private client: ClientInterface

  constructor(client: ClientInterface) {
    this.client = client
    this.name = 'RouteLoader'
  }

  public async load(): Promise<void> {
    try {
      const routeFiles = await this.findRouteFiles(DIR_ROUTES)
      await this.registerRoutes(routeFiles)
      this.client.LOG('All routes successfully loaded', this.name)
    } catch (error: any) {
      this.client.LOG_ERR(error.message, this.name, 'Loading Routes')
    }
  }

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

  private async registerRoutes(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        const routePath = path.resolve(file)
        const routeModule = await import(routePath)
        const RouteClass = routeModule.default

        if (RouteClass.prototype instanceof RoutesModel) {
          const routeInstance = new RouteClass(this.client, {
            path: '/',
            name: 'Default Route',
            description: 'No Description',
          })

          if (routeInstance instanceof RoutesModel) {
            this.client.routes.push(routeInstance)
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
