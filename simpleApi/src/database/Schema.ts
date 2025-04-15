import {
  Model,
  Document,
  Types,
  Schema as MongooseSchema,
  SchemaDefinition,
} from 'mongoose'

export class Schema<
  DocType extends Document = Document,
  M extends Model<DocType> = Model<DocType>,
> extends MongooseSchema<DocType, M> {
  constructor(definition?: SchemaDefinition<DocType>) {
    super(definition)
  }
}

export type { Model, Document, Types }
