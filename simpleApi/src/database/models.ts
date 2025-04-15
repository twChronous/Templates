import { createModelFactory } from './createModelFactory'
import { UserSchema } from './schemas/UserSchema'

export const Users = createModelFactory('User', UserSchema)
