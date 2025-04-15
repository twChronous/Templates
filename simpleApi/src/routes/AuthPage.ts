import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import JWT from 'jsonwebtoken'

import RoutesModel from '../models/RoutesModel'
import { ClientInterface } from '../utils/types'
import { authenticateToken } from '../middlewares/authToken'

export default class AuthRoutes extends RoutesModel {
  constructor(client: ClientInterface) {
    super(client, {
      path: '/auth',
      name: 'AuthRoutes',
      description: 'Rotas de Autenticação',
    })
  }

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

  private async loginUser(req: Request, res: Response): Promise<void | any> {
    try {
      const { email, password } = req.body

      // Find the user by email
      const user = await this.client.users.findOne({ email })
      if (!user) {
        console.log('User not found')
        return res.status(404).json({ error: 'User not found' })
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        console.log('Invalid password')
        return res.status(400).json({ error: 'Invalid password' })
      }

      // Generate JWT token after all validations
      const token = JWT.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET!,
        {
          expiresIn: process.env.JWT_EXPIRATION || 86400, // 24 hours
        },
      )

      console.log('Login successful, sending token')
      return res.json({ email, token })
    } catch (error) {
      console.error('Error during login:', error) // Debugging log
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  private async CreateUser(req: Request, res: Response): Promise<void | any> {
    const isValidUser = await this.client.users.findOne({
      _id: req.body.auth.id,
    })
    if (!isValidUser) {
      res.status(403).send({ error: 'Unauthorized access' })
      return false
    }
    if (req.body.password.length < 6)
      return res.status(400).json({ error: 'Password is less than 6 digits' })
    if (await this.client.users.findOne({ email: req.body.email })) {
      return res.status(400).json({ error: 'email already exists' })
    }

    const user = await this.client.users.add(req.body)
    if (!user) {
      console.log('Error while creating user')
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

  private async updatePassword(
    req: Request,
    res: Response,
  ): Promise<void | any> {
    const user = await this.client.users.findOne({ _id: req.body.auth.id })
    if (!user) {
      res.status(403).send({ error: 'Unauthorized access' })
      return false
    }
    try {
      const { currentPassword, newPassword } = req.body
      // Compare the provided current password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      )
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // Update the user's password
      const updatedUser = await this.client.users.update(
        { _id: req.body.auth.id! },
        { password: hashedNewPassword },
      )
      if (!updatedUser) {
        return res.status(400).json({ error: 'Error updating password' })
      }
      console.log('Password updated successfully')
      return res.json({ message: 'Password updated successfully' })
    } catch (error) {
      console.error('Error updating password:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}
