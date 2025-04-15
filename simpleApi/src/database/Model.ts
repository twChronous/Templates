import type {
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  Query,
  Model as ModelType,
} from 'mongoose'

import type { BaseSchema } from '../utils/types'

/**
 * @class Model
 * @template T - Tipo do documento baseado em BaseSchema
 * 
 * @description Classe genérica para encapsular operações de banco de dados usando Mongoose.
 */
export class Model<T extends BaseSchema> {
  /** @private */
  #model: ModelType<T>

  /**
   * @constructor
   * @param {ModelType<T>} model - Instância do modelo Mongoose
   */
  constructor(model: ModelType<T>) {
    this.#model = model
  }

  /**
   * Getter para acessar o modelo Mongoose original
   * @returns {ModelType<T>}
   */
  get model(): ModelType<T> {
    return this.#model
  }

  /**
   * Cria um novo documento no banco
   * @param {Partial<T>} document - Dados do novo documento
   * @returns {Promise<T>}
   */
  add(document: Partial<T>): Promise<T> {
    return this.model.create(document as T)
  }

  /**
   * Remove um documento pelo ID
   * @param {string} id - ID do documento a ser removido
   * @returns {Promise<any>} - Resultado da operação
   */
  async remove(id: string): Promise<any> {
    return this.model.findOneAndDelete({ _id: id } as any)
  }

  /**
   * Busca um documento com base em condições
   * @param {FilterQuery<T>} conditions - Condições de filtro
   * @param {string} [projection] - Campos a serem retornados
   * @param {QueryOptions} [options={}] - Opções adicionais
   * @returns {Promise<T | null>}
   */
  async findOne(
    conditions: FilterQuery<T>,
    projection?: string,
    options: QueryOptions = {},
  ): Promise<T | null> {
    return this.model.findOne(conditions, projection, options)
  }

  /**
   * Busca múltiplos documentos com base em condições
   * @param {FilterQuery<T>} [filter={}] - Condições de filtro
   * @param {string} [projection] - Campos a serem retornados
   * @param {QueryOptions} [options={}] - Opções adicionais
   * @returns {Promise<T[]>}
   */
  async findAll(
    filter: FilterQuery<T> = {},
    projection?: string,
    options: QueryOptions = {},
  ): Promise<T[]> {
    return this.model.find(filter, projection, options)
  }

  /**
   * Atualiza um único documento com base em um filtro
   * @param {FilterQuery<T>} filter - Filtro de seleção
   * @param {UpdateQuery<T>} [doc={}] - Atualizações a serem aplicadas
   * @param {any} [options={}] - Opções adicionais
   * @returns {Promise<Query<any, T>>}
   */
  async update(
    filter: FilterQuery<T>,
    doc: UpdateQuery<T> = {},
    options: any = {},
  ): Promise<Query<any, T>> {
    return this.model.updateOne(filter, doc, options)
  }

  /**
   * Atualiza múltiplos documentos com base em um filtro
   * @param {FilterQuery<T>} filter - Filtro de seleção
   * @param {UpdateQuery<T>} [doc={}] - Atualizações a serem aplicadas
   * @param {any} [options={}] - Opções adicionais
   * @returns {Promise<Query<any, T>>}
   */
  async updateMany(
    filter: FilterQuery<T>,
    doc: UpdateQuery<T> = {},
    options: any = {},
  ): Promise<Query<any, T>> {
    return this.model.updateMany(filter, doc, options)
  }
}
