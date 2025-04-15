import { connect } from '../database/connect'
import { Users } from '../database/models'
import { ClientInterface } from '../utils/types'

export default class DatabaseLoader {
  name: string

  client: ClientInterface

  constructor(client: ClientInterface) {
    this.name = 'DatabaseLoader'
    this.client = client
  }

  async load(): Promise<void> {
    try {
      await this.LoaderDatabase()
      this.client.LOG('The database was successfully imported!', 'DATABASE')
    } catch (error: any) {
      this.client.LOG_ERR(error, this.name)
    }
  }

  async LoaderDatabase(): Promise<void> {
    try {
      await connect()
      this.client.users = Users
    } catch (error: any) {
      this.client.LOG_ERR(error, this.name)
    }
  }
}
