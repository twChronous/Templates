import { RoutesModelOptions, ClientInterface } from '../utils/types'

/**
 * Classe base para definição de rotas na aplicação.
 * Esta classe pode ser estendida para criar rotas específicas que se conectam com o servidor principal.
 */
export default class RoutesModel {
  /**
   * Instância do cliente principal que está utilizando esta rota.
   * Permite acesso à aplicação Express, banco de dados e outras ferramentas comuns.
   */
  client: ClientInterface

  /**
   * Caminho base da rota. Exemplo: "/users", "/auth".
   */
  path: string

  /**
   * Nome descritivo da rota, usado para organização ou logs.
   */
  name: string

  /**
   * Descrição da rota, útil para documentação automática ou leitura de código.
   */
  description: string

  /**
   * Construtor da classe RoutesModel.
   * Inicializa os valores com base nas opções fornecidas.
   * 
   * @param client - Instância do Client que contém o app Express e outros utilitários.
   * @param options - Objeto contendo path, name e description da rota.
   */
  constructor(client: ClientInterface, options: RoutesModelOptions) {
    this.client = client

    // Define o path, nome e descrição com valores padrão caso não sejam passados
    this.path = options.path || '/'
    this.name = options.name || 'Sem Nome'
    this.description = options.description || 'Nenhuma'
  }

  /**
   * Método a ser sobrescrito por classes que estendem RoutesModel.
   * Deve conter a lógica de definição da rota, por exemplo: this.client.app.get(...)
   */
  public run(): void {}
}
