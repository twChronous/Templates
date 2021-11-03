import { createModelFactory } from './createModelFactory'
import { UserSchema } from './schemas/UserSchema'

export const Users = createModelFactory('Users', UserSchema)