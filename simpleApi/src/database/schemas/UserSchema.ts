import bcrypt from 'bcrypt'

import type { UserOptions } from '../../utils/types'
import { Schema, Document } from '../Schema'

const UserSchema = new Schema<UserOptions & Document>({
  name: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false, required: true },
  email: { type: String, required: true },
})

UserSchema.pre('save', async function (next) {
  const user = this as UserOptions
  const hash = await bcrypt.hash(user.password, 10)
  if (user.password.substring(0, 7) !== '$2b$10$') user.password = hash
  next()
})

export { UserSchema }
