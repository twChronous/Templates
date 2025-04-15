import { RoutesModelOptions, ClientInterface } from '../utils/types'

export default class RoutesModel {
  client: ClientInterface

  path: string

  name: string

  description: string

  constructor(client: ClientInterface, options: RoutesModelOptions) {
    this.client = client
    ;(this.path = options.path || '/'), (this.name = options.name || 'Sem Nome')
    this.description = options.description || 'Nenhuma'
  }

  public run(): void {}
}
