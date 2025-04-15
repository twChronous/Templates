import { model as applyModel } from 'mongoose'

import { Model } from './Model'
import type { Schema } from './Schema'

/**
 * @typedef {S extends Schema<infer T> ? T : never} ExtractDocType
 * @description Tipo que extrai o tipo do documento a partir de um Schema.
 * @param {Schema<any>} S - O Schema do qual o tipo de documento será extraído.
 * @returns {T} - O tipo do documento.
 */
type ExtractDocType<S> = S extends Schema<infer T> ? T : never

/**
 * Cria uma instância do modelo Mongoose utilizando o Schema fornecido.
 * 
 * @function createModelFactory
 * @template S - O tipo do Schema usado para criar o modelo.
 * @param {string} name - O nome do modelo.
 * @param {S} schema - O Schema para o modelo.
 * @returns {Model<ExtractDocType<S>>} - Uma instância do modelo Mongoose encapsulado pela classe Model.
 * 
 * @example
 * const userModel = createModelFactory('User', userSchema);
 */
export function createModelFactory<S extends Schema<any>>(
  name: string,
  schema: S,
): Model<ExtractDocType<S>> {
  const model = applyModel(name, schema as any as Schema<ExtractDocType<S>>)
  const instance = new Model<ExtractDocType<S>>(model as any)

  return instance
}
