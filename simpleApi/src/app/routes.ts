import { Router } from 'express'

import {
  UserControler,
  AuthControler,
  verifyJWT,
} from './controllers'

export const routes = Router()

routes
  .get('/users', UserControler.getAllUsers)
  .get('/users/:id', UserControler.getUserById)
  .delete('/users/:id', verifyJWT, UserControler.removeUser)
  .post('/users', UserControler.createUser)

  .post('/auth', AuthControler.loginUser)
  .get('/verify', AuthControler.verifyEmail)
