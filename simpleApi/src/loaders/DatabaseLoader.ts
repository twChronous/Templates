// Importa a função de conexão com o banco de dados
import { connect } from '../database/connect'

// Importa o modelo de usuários do banco de dados
import { Users } from '../database/models'

// Importa a interface do cliente para garantir que o objeto passado siga o contrato
import { ClientInterface } from '../utils/types'

/**
 * Classe responsável por carregar e inicializar a conexão com o banco de dados.
 */
export default class DatabaseLoader {
  /**
   * Nome do loader, usado para fins de logging.
   */
  name: string

  /**
   * Instância do cliente principal da aplicação, contendo app, logs e modelos.
   */
  client: ClientInterface

  /**
   * Construtor da classe que recebe o cliente principal.
   * @param client - Instância que implementa a interface ClientInterface
   */
  constructor(client: ClientInterface) {
    this.name = 'DatabaseLoader'
    this.client = client
  }

  /**
   * Método principal que será chamado pelos loaders da aplicação.
   * Tenta carregar o banco de dados e loga o sucesso ou erro.
   */
  async load(): Promise<void> {
    try {
      await this.LoaderDatabase() // Tenta carregar o banco
      this.client.LOG('The database was successfully imported!', 'DATABASE') // Sucesso
    } catch (error: any) {
      this.client.LOG_ERR(error, this.name) // Falha
    }
  }

  /**
   * Método responsável por realizar a conexão com o banco e injetar os modelos.
   * Ele pode ser reutilizado ou chamado diretamente para reinstanciar a conexão.
   */
  async LoaderDatabase(): Promise<void> {
    try {
      await connect() // Estabelece conexão com o banco de dados
      this.client.users = Users // Associa o modelo Users à instância do cliente
    } catch (error: any) {
      this.client.LOG_ERR(error, this.name) // Em caso de erro, loga o erro
    }
  }
}
