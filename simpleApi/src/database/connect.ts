import mongoose from 'mongoose'

export function connect(): Promise<typeof mongoose> {
  return mongoose.connect(process.env.MONGODB_URI!)
}
