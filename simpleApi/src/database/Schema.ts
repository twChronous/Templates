// Importações do Mongoose necessárias para definir e tipar esquemas e modelos
import {
    Model,           // Representa um modelo Mongoose (ex: UserModel, TodoModel)
    Document,        // Representa um documento no Mongo (com _id, etc.)
    Types,           // Tipos utilitários do Mongoose (ex: ObjectId)
    Schema as MongooseSchema, // Renomeia pra evitar conflito com a classe abaixo
    SchemaDefinition // Define a forma do objeto que será passado no construtor do Schema
  } from 'mongoose'
  
  /**
   * Classe customizada `Schema`, que estende o `Mongoose.Schema` original.
   * 
   * Essa classe existe basicamente pra:
   * - Tipar melhor os documentos (`DocType`) e os modelos (`M`)
   * - Reutilizar de forma consistente com generics
   * 
   * @template DocType - Tipo do documento (default: Document)
   * @template M - Tipo do modelo (default: Model<DocType>)
   */
  export class Schema<
    DocType extends Document = Document,
    M extends Model<DocType> = Model<DocType>,
  > extends MongooseSchema<DocType, M> {
    /**
     * Construtor que repassa a definição do schema pro Schema original do Mongoose.
     * @param definition - Estrutura do schema no formato `{ campo: tipo }`
     */
    constructor(definition?: SchemaDefinition<DocType>) {
      super(definition)
    }
  }
  
  // Reexporta os tipos mais usados no Mongoose pra facilitar nos outros arquivos
  export type { Model, Document, Types }
  