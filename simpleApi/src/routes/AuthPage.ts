import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import JWT from 'jsonwebtoken'

import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'
import { authenticateToken } from '../middlewares/authToken'

/**
 * A classe que gerencia as rotas de autenticação (login, criação de usuário e atualização de senha).
 * Extende a classe RoutesModel e adiciona as rotas para autenticação de usuários.
 * 
 * @class AuthRoutes
 * @extends RoutesModel
 */
export default class AuthRoutes extends RoutesModel {
  /**
   * Cria uma instância da classe AuthRoutes.
   * 
   * @constructor
   * @param {ClientInterface} client - O cliente que contém o aplicativo Express.
   */
  constructor(client: ClientInterface) {
    super(client, {
      path: '/auth',
      name: 'AuthRoutes',
      description: 'Rotas de Autenticação',
    })
  }

  /**
   * Registra as rotas de autenticação no aplicativo Express.
   * 
   * @method run
   */
  public run(): void {
    this.client.app.post(`${this.path}/login`, this.loginUser.bind(this))
    this.client.app.post(
      `${this.path}/create-user`,
      authenticateToken,
      this.CreateUser.bind(this),
    )
    this.client.app.post(
      `${this.path}/update-password`,
      authenticateToken,
      this.updatePassword.bind(this),
    )
  }

  /**
   * Realiza o login de um usuário, validando suas credenciais e gerando um token JWT.
   * 
   * @async
   * @method loginUser
   * @param {Request} req - A requisição HTTP contendo os dados do usuário.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Responde com um token JWT se a autenticação for bem-sucedida.
   */
  private async loginUser(req: Request, res: Response): Promise<void | any> {
    try {
      const { email, password } = req.body

      // Encontra o usuário pelo email
      const user = await this.client.users.findOne({ email })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Compara a senha fornecida com a senha armazenada
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid password' })
      }

      // Gera o token JWT após as validações
      const token = JWT.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET!,
        {
          expiresIn: process.env.JWT_EXPIRATION || 86400, // 24 horas
        },
      )

      return res.json({ email, token })
    } catch (error) {
      console.error('Error during login:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  /**
   * Cria um novo usuário no sistema, validando se o usuário autenticado tem permissão para isso.
   * 
   * @async
   * @method CreateUser
   * @param {Request} req - A requisição HTTP contendo os dados do novo usuário.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Responde com o token JWT do novo usuário após a criação.
   */
  private async CreateUser(req: Request, res: Response): Promise<void | any> {
    const isValidUser = await this.client.users.findOne({
      _id: req.body.auth.id,
    })
    if (!isValidUser) {
      res.status(403).send({ error: 'Unauthorized access' })
      return
    }
    if (req.body.password.length < 6)
      return res.status(400).json({ error: 'Password is less than 6 digits' })
    if (await this.client.users.findOne({ email: req.body.email })) {
      return res.status(400).json({ error: 'email already exists' })
    }

    const user = await this.client.users.add(req.body)
    if (!user) {
      return res.status(400).json({ error: 'Error while creating user' })
    }
    const token = JWT.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRATION!,
      },
    )

    return res.json({ email: user.email, token })
  }

  /**
   * Atualiza a senha de um usuário autenticado, validando a senha atual antes de permitir a atualização.
   * 
   * @async
   * @method updatePassword
   * @param {Request} req - A requisição HTTP contendo a senha atual e a nova senha.
   * @param {Response} res - A resposta HTTP a ser enviada ao cliente.
   * @returns {Promise<void>} Responde com uma mensagem de sucesso ou erro.
   */
  private async updatePassword(
    req: Request,
    res: Response,
  ): Promise<void | any> {
    const user = await this.client.users.findOne({ _id: req.body.auth.id })
    if (!user) {
      res.status(403).send({ error: 'Unauthorized access' })
      return
    }
    try {
      const { currentPassword, newPassword } = req.body
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      )
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      const updatedUser = await this.client.users.update(
        { _id: req.body.auth.id! },
        { password: hashedNewPassword },
      )
      if (!updatedUser) {
        return res.status(400).json({ error: 'Error updating password' })
      }
      return res.json({ message: 'Password updated successfully' })
    } catch (error) {
      console.error('Error updating password:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}
