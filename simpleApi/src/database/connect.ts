import mongoose from 'mongoose'

/**
 * Função que estabelece a conexão com o banco de dados MongoDB utilizando a URI fornecida nas variáveis de ambiente.
 * 
 * @function connect
 * @description Conecta o aplicativo ao banco de dados MongoDB usando a URI definida em `process.env.MONGODB_URI`.
 * 
 * @returns {Promise<typeof mongoose>} Retorna uma Promise que resolve com o objeto `mongoose` conectado.
 * @throws {Error} Lança um erro caso a conexão falhe.
 */
export function connect(): Promise<typeof mongoose> {
  return mongoose.connect(process.env.MONGODB_URI!)
}
