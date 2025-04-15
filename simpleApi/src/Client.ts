import cors from 'cors'
import express, { Application } from 'express'

import Loaders from './loaders/index'
import { Users } from './database/models'
import { ClientInterface, RoutesModelOptions } from './utils/types'

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}

export default class Client implements ClientInterface {
  public app: Application
  public users: typeof Users
  public routes: RoutesModelOptions[]

  constructor() {
    this.users = Users
    this.routes = []
    this.app = express()
    this.app.use(express.json())
    this.app.use(cors(corsOptions))
  }

  public startServer(port: number): void {
    this.app.listen(port, () => {
      this.LOG(`http://localhost:${port}/`, 'App is running')
    })
    this.initializeLoaders()
  }

  private async initializeLoaders(): Promise<void> {
    const loaders: Array<typeof Loaders[keyof typeof Loaders]> =
      Object.values(Loaders)
    let loadedCount = 0
    for (const LoaderClass of loaders) {
      const loaderInstance = new LoaderClass(this)
      try {
        await loaderInstance.load()
        loadedCount++
      } catch (e) {
        this.LOG_ERR(
          e instanceof Error ? e.message : String(e),
          loaderInstance.name,
        )
      }
    }

    this.LOG(
      `Successfully loaded ${loadedCount} modules out of ${loaders.length}`,
      'LOADERS',
    )
  }

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

  public LOG_ERR(...args: string[]): void {
    const error = args[0]
    const Sendlog =
      args.length > 1 ? args.slice(1).map(t => `\x1b[33m[${t}]\x1b[0m`) : ''
    console.error('\x1b[31m[ERROR]\x1b[0m', ...Sendlog, error)
  }

  public Error(err: any): void {
    throw new Error(err.message ? err.message : String(err))
  }
}
