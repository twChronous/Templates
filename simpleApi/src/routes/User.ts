import bcrypt from 'bcrypt'
import { Request, Response } from 'express'

import { authenticateToken } from '../middlewares/authToken'
import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'

/**
 * Classe que gerencia as rotas da página de usuário, incluindo a visualização, atualização e remoção de informações do usuário.
 * 
 * @class UserPage
 * @extends RoutesModel
 */
export default class UserPage extends RoutesModel {
  /**
   * Cria uma instância da classe UserPage.
   * 
   * @constructor
   * @param {ClientInterface} client - O cliente que contém o aplicativo Express.
   */
  constructor(client: ClientInterface) {
    super(client, {
      path: '/user',
      name: 'User page',
      description: 'Mostra o usuario e suas informações',
    })
  }

  /**
   * Registra as rotas de usuário no servidor Express.
   * 
   * @method run
   */
  public run(): void {
    this.client.app.get(this.path, authenticateToken, this.ShowAll.bind(this))
    this.client.app.delete(
      this.path,
      authenticateToken,
      this.removeUser.bind(this),
    )
    this.client.app.get(
      `${this.path}/token`,
      authenticateToken,
      this.getByToken.bind(this),
    )
    this.client.app.put(
      this.path,
      authenticateToken,
      this.UpdateUser.bind(this),
    )
  }

  /**
   * Verifica se o usuário autenticado existe no banco de dados.
   * 
   * @async
   * @method verifyUser
   * @param {Request} req - A requisição HTTP contendo o ID do usuário autenticado.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<boolean>} Retorna true se o usuário existir, caso contrário, responde com um erro 403.
   */
  private async verifyUser(req: Request, res: Response): Promise<boolean> {
    const user = await this.client.users.findOne({ _id: req.body.auth.id })
    if (!user) {
      res.sendStatus(403)
      return false
    }
    return true
  }

  /**
   * Exibe informações sobre o usuário autenticado ou, se for um administrador, sobre todos os usuários.
   * 
   * @async
   * @method ShowAll
   * @param {Request} req - A requisição HTTP.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Retorna informações do usuário ou uma lista de todos os usuários, dependendo do nível de acesso.
   */
  private async ShowAll(req: Request, res: Response): Promise<void | any> {
    if (!(await this.verifyUser(req, res))) return
    if (!req.body.auth.isAdmin) {
      return await this.client.users
        .findOne({ _id: req.body.auth.id })
        .then(user => res.status(200).send(user))
        .catch((err: any) => res.status(404).json({ error: err.message }))
    }
    const data = await this.client.users.findAll({}, '', { sort: { name: 1 } })
    res.status(data.length > 0 ? 200 : 204).send(data)
  }

  /**
   * Remove um usuário do banco de dados, validando a senha antes de permitir a exclusão.
   * 
   * @async
   * @method removeUser
   * @param {Request} req - A requisição HTTP contendo o ID do usuário a ser removido e a senha para validação.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Responde com um status 200 se a remoção for bem-sucedida ou um erro em caso de falha.
   */
  private async removeUser(req: Request, res: Response) {
    if (!req.body.auth.isAdmin && req.body.auth.id !== req.body.id) {
      return res.sendStatus(403)
    }
    if (!(await this.verifyUser(req, res))) return
    try {
      const user = await this.client.users.findOne({ _id: req.body.id })

      if (!user) return res.status(404).json({ error: 'User not found' })

      const isPasswordValid = await bcrypt.compare(
        req.body.password,
        user.password,
      )

      if (!isPasswordValid && !req.body.auth.isAdmin) {
        return res.status(400).json({ error: 'Invalid password' })
      }

      await this.client.users.remove(req.body.id)

      res.status(200).send({ removedUserId: req.body.id })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  /**
   * Exibe as informações do usuário autenticado com base no token JWT.
   * 
   * @async
   * @method getByToken
   * @param {Request} req - A requisição HTTP.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Retorna as informações do usuário autenticado ou um erro caso o usuário não seja encontrado.
   */
  private async getByToken(req: Request, res: Response): Promise<void | any> {
    if (!(await this.verifyUser(req, res))) return
    await this.client.users
      .findOne({ _id: req.body.auth.id })
      .then(user => res.status(200).send(user))
      .catch((err: any) => res.status(404).json({ error: err.message }))
  }

  /**
   * Atualiza as informações do usuário autenticado.
   * 
   * @async
   * @method UpdateUser
   * @param {Request} req - A requisição HTTP contendo os novos dados do usuário.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Retorna as informações do usuário após a atualização.
   */
  private async UpdateUser(req: Request, res: Response): Promise<void | any> {
    if (!(await this.verifyUser(req, res))) return
    await this.client.users
      .update(
        { _id: req.body.auth.id },
        {
          name: req.body.name!,
        },
      )
      .catch((err: any) => res.status(400).json({ error: err.message }))
    await this.client.users
      .findOne({ _id: req.body.id! })
      .then(user => res.status(200).send(user))
      .catch((err: any) => res.status(400).json({ error: err.message }))
  }
}
