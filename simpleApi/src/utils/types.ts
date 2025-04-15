import { Application } from 'express'

import { Users } from '../database/models'

export interface BaseSchema {
  _id: string
  createdAt: string
  updatedAt: string
}

export interface UserOptions {
  _id: string
  name: string
  email: string
  password: string
  isAdmin: boolean
}

export interface RoutesModelOptions {
  path: string
  name: string
  description: string
}

export interface ClientInterface {
  app: Application
  routes: RoutesModelOptions[]
  users: typeof Users
  LOG(...args: string[]): void
  LOG_ERR(...args: string[]): void
  Error(...args: string[]): void
}
