import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'

/**
 * Middleware para autenticar requisições via JWT.
 * 
 * Este middleware verifica se o cabeçalho `Authorization` da requisição contém
 * um token JWT válido. Se o token for válido, o conteúdo decodificado será
 * armazenado em `req.body.auth` e a execução prosseguirá para o próximo middleware.
 * 
 * Caso o token esteja ausente, inválido ou expirado, será retornado um erro apropriado.
 * 
 * @param req - Objeto da requisição Express.
 * @param res - Objeto da resposta Express.
 * @param next - Função que chama o próximo middleware.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Obtém o cabeçalho de autorização, onde se espera: "Bearer <token>"
    const authHeader = req.headers.authorization
    let token

    // Verifica se o cabeçalho existe e começa com "Bearer "
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extrai apenas o token após "Bearer "
      token = authHeader.split(' ')[1]
    }

    // Se nenhum token for encontrado, retorna erro 401 (não autorizado)
    if (!token) {
      return res.status(401).json({ message: 'Token not provided' })
    }

    // Verifica se o token é válido usando a chave secreta definida no .env
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        // Se o erro for por expiração do token, retorna erro 401
        if (err instanceof TokenExpiredError) {
          return res.status(401).json({ message: 'Token expired' })
        }
        // Para outros erros (token inválido, malformado, etc.), retorna erro 403
        return res.status(403).json({ message: 'Invalid token' })
      }

      // Armazena o conteúdo decodificado do token no corpo da requisição
      req.body.auth = decoded

      // Prossegue para o próximo middleware ou rota
      next()
    })
  } catch (error) {
    // Em caso de erro inesperado no servidor, retorna 500
    console.error('Error in authentication middleware:', error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}
