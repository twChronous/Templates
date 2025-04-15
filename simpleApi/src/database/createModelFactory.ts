import { model as applyModel } from 'mongoose'

import { Model } from './Model'
import type { Schema } from './Schema'

type ExtractDocType<S> = S extends Schema<infer T> ? T : never

export function createModelFactory<S extends Schema<any>>(
  name: string,
  schema: S,
): Model<ExtractDocType<S>> {
  const model = applyModel(name, schema as any as Schema<ExtractDocType<S>>)
  const instance = new Model<ExtractDocType<S>>(model as any)

  return instance
}
