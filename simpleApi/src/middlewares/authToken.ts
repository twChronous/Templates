import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization
    let token

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'Token not provided' }) // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        // Checar se o erro é por token expirado
        if (err instanceof TokenExpiredError) {
          return res.status(401).json({ message: 'Token expired' }) // Unauthorized devido ao token expirado
        }
        return res.status(403).json({ message: 'Invalid token' }) // Forbidden para outros erros de verificação
      }

      req.body.auth = decoded // Armazena o conteúdo decodificado no corpo da requisição
      next() // Prossegue para a próxima middleware
    })
  } catch (error) {
    console.error('Error in authentication middleware:', error)
    return res.status(500).json({ message: 'Internal Server Error' }) // Caso ocorra algum erro inesperado
  }
}
