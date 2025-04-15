import { Application } from 'express'

import { Users } from '../database/models'

/**
 * Representa a estrutura base de um schema.
 * 
 * @interface BaseSchema
 * @property {string} _id - O identificador único do documento.
 * @property {string} createdAt - A data e hora em que o documento foi criado.
 * @property {string} updatedAt - A data e hora em que o documento foi atualizado.
 */
export interface BaseSchema {
  _id: string
  createdAt: string
  updatedAt: string
}

/**
 * Representa as opções de um usuário no sistema.
 * 
 * @interface UserOptions
 * @property {string} _id - O identificador único do usuário.
 * @property {string} name - O nome do usuário.
 * @property {string} email - O e-mail do usuário.
 * @property {string} password - A senha do usuário.
 * @property {boolean} isAdmin - Indica se o usuário é um administrador.
 */
export interface UserOptions {
  _id: string
  name: string
  email: string
  password: string
  isAdmin: boolean
}

/**
 * Representa as opções para um modelo de rota.
 * 
 * @interface RoutesModelOptions
 * @property {string} path - O caminho da rota.
 * @property {string} name - O nome da rota.
 * @property {string} description - A descrição da rota.
 */
export interface RoutesModelOptions {
  path: string
  name: string
  description: string
}

/**
 * Interface que define a estrutura do cliente do servidor.
 * 
 * @interface ClientInterface
 * @property {Application} app - A aplicação Express.
 * @property {RoutesModelOptions[]} routes - A lista de rotas disponíveis no servidor.
 * @property {typeof Users} users - O modelo de usuários no banco de dados.
 * @property {Function} LOG - Função para registrar logs gerais.
 * @property {Function} LOG_ERR - Função para registrar logs de erro.
 * @property {Function} Error - Função para registrar erros.
 */
export interface ClientInterface {
  app: Application
  routes: RoutesModelOptions[]
  users: typeof Users
  LOG(...args: string[]): void
  LOG_ERR(...args: string[]): void
  Error(...args: string[]): void
}
