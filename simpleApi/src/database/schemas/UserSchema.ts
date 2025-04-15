import bcrypt from 'bcrypt'

import type { UserOptions } from '../../utils/types'
import { Schema, Document } from '../Schema'

/**
 * @typedef {UserOptions & Document} UserSchemaType
 * @description Tipo do Schema do usuário, combinando as opções de usuário com o tipo `Document` do Mongoose.
 */

/**
 * O Schema do usuário, utilizado para validar e modelar os dados do usuário no banco de dados.
 * 
 * @constant UserSchema
 * @type {Schema<UserOptions & Document>}
 * @description Define o modelo de dados do usuário, incluindo campos como `name`, `password`, `isAdmin`, e `email`.
 */
const UserSchema = new Schema<UserOptions & Document>({
  name: { type: String, required: true },  // Nome do usuário
  password: { type: String, required: true },  // Senha do usuário (será criptografada)
  isAdmin: { type: Boolean, default: false, required: true },  // Se o usuário é administrador
  email: { type: String, required: true },  // E-mail do usuário
})

/**
 * Middleware que executa antes de salvar o documento do usuário no banco de dados.
 * Este middleware criptografa a senha do usuário antes de armazená-la.
 * 
 * @function
 * @name UserSchema.pre('save')
 * @description Criptografa a senha do usuário antes de salvar o documento no banco de dados.
 * 
 * @param {function} next - A função a ser chamada após o término do middleware.
 * @returns {Promise<void>} Uma Promise que representa a operação de criptografia da senha.
 */
UserSchema.pre('save', async function (next) {
  const user = this as UserOptions  // Tipo de 'this' como 'UserOptions'
  const hash = await bcrypt.hash(user.password, 10)  // Criptografa a senha com um salt de 10
  if (user.password.substring(0, 7) !== '$2b$10$') user.password = hash  // Verifica se a senha já está criptografada
  next()  // Chama a próxima função no ciclo de vida
})

export { UserSchema }
