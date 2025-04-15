import { Request, Response } from 'express'

import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'

/**
 * Classe que gerencia as rotas da página principal (Landing Page), incluindo o acesso à rota principal e a ajuda com informações sobre as rotas disponíveis.
 * 
 * @class LandingPage
 * @extends RoutesModel
 */
export default class LandingPage extends RoutesModel {
  /**
   * Cria uma instância da classe LandingPage.
   * 
   * @constructor
   * @param {ClientInterface} client - O cliente que contém o aplicativo Express.
   */
  constructor(client: ClientInterface) {
    super(client, {
      path: '/',
      name: 'LandingPage',
      description: 'Página Principal',
    })
  }

  /**
   * Registra as rotas de LandingPage no servidor Express.
   * 
   * @method run
   */
  public run(): void {
    // Rota principal: Exibe uma mensagem "Hello World!"
    this.client.app.get(this.path, (req: Request, res: Response) => {
      const data = { message: 'Hello World!' }
      res.status(200).send(data)
    })
    
    // Rota de ajuda: Exibe uma lista com informações sobre todas as rotas registradas
    this.client.app.get(`${this.path}/help`, (req: Request, res: Response) => {
        res.status(200).send(
            this.client.routes.map(route => ({
                path: route.path,
                name: route.name,
                description: route.description,
            })
        ))
    })
  }
}
