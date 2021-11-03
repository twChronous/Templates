export interface BaseSchema {
  _id: string
  createdAt: string
  updatedAt: string
}

export interface User extends BaseSchema {
  password: string
  email: string
  name: string
  nickname?: string
  profilePic?: string
  bornDate: string
  bio: string
  stars: string
  level: string
  xp: string
  dev: boolean
  verified: boolean
}
