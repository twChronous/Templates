import bcrypt from 'bcrypt'
import { Request, Response } from 'express'

import { authenticateToken } from '../middlewares/authToken'
import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'

export default class UserPage extends RoutesModel {
  constructor(client: ClientInterface) {
    super(client, {
      path: '/user',
      name: 'User page',
      description: 'Mostra o usuario e suas informações',
    })
  }

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

  private async verifyUser(req: Request, res: Response): Promise<boolean> {
    const user = await this.client.users.findOne({ _id: req.body.auth.id })
    if (!user) {
      res.sendStatus(403)
      return false
    }
    return true
  }

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
        console.log('Invalid password')
        return res.status(400).json({ error: 'Invalid password' })
      }
      // Remove todos os slots associados ao usuário, um por um
      await this.client.users.remove(req.body.id)

      res.status(200).send({ removedUserId: req.body.id })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  private async getByToken(req: Request, res: Response): Promise<void | any> {
    if (!(await this.verifyUser(req, res))) return
    await this.client.users
      .findOne({ _id: req.body.auth.id })
      .then(user => res.status(200).send(user))
      .catch((err: any) => res.status(404).json({ error: err.message }))
  }

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
