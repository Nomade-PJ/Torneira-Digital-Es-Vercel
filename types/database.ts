// Tipos principais do banco de dados
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome_completo: string | null
          nome_estabelecimento: string
          cnpj_cpf: string
          telefone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome_completo?: string | null
          nome_estabelecimento: string
          cnpj_cpf: string
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome_completo?: string | null
          nome_estabelecimento?: string
          cnpj_cpf?: string
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      produtos: {
        Row: {
          id: string
          usuario_id: string
          nome: string
          marca: string | null
          volume: string | null
          categoria: string
          estoque_atual: number
          estoque_minimo: number
          preco_compra: number
          preco_venda: number
          fornecedor: string | null
          descricao: string | null
          codigo_barras: string | null
          data_validade: string | null
          imagem_url: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome: string
          marca?: string | null
          volume?: string | null
          categoria: string
          estoque_atual?: number
          estoque_minimo?: number
          preco_compra: number
          preco_venda: number
          fornecedor?: string | null
          descricao?: string | null
          codigo_barras?: string | null
          data_validade?: string | null
          imagem_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome?: string
          marca?: string | null
          volume?: string | null
          categoria?: string
          estoque_atual?: number
          estoque_minimo?: number
          preco_compra?: number
          preco_venda?: number
          fornecedor?: string | null
          descricao?: string | null
          codigo_barras?: string | null
          data_validade?: string | null
          imagem_url?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      movimentacoes: {
        Row: {
          id: string
          usuario_id: string
          produto_id: string
          tipo: "entrada" | "saida"
          motivo: string
          quantidade: number
          preco_unitario: number
          valor_total: number
          responsavel: string
          fornecedor: string | null
          observacao: string | null
          status: "pendente" | "concluida" | "cancelada"
          data_movimentacao: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          produto_id: string
          tipo: "entrada" | "saida"
          motivo: string
          quantidade: number
          preco_unitario: number
          valor_total: number
          responsavel: string
          fornecedor?: string | null
          observacao?: string | null
          status?: "pendente" | "concluida" | "cancelada"
          data_movimentacao?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          produto_id?: string
          tipo?: "entrada" | "saida"
          motivo?: string
          quantidade?: number
          preco_unitario?: number
          valor_total?: number
          responsavel?: string
          fornecedor?: string | null
          observacao?: string | null
          status?: "pendente" | "concluida" | "cancelada"
          data_movimentacao?: string
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          usuario_id: string
          nome_estabelecimento: string | null
          email_contato: string | null
          telefone: string | null
          endereco: string | null
          logo_url: string | null
          notificacao_estoque_baixo: boolean
          notificacao_email: boolean
          notificacao_push: boolean
          estoque_minimo_padrao: number
          alerta_estoque_critico: number
          backup_automatico: boolean
          frequencia_backup: string
          regime_tributario: string | null
          inscricao_estadual: string | null
          moeda: string
          formato_data: string
          dias_relatorio_padrao: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome_estabelecimento?: string | null
          email_contato?: string | null
          telefone?: string | null
          endereco?: string | null
          logo_url?: string | null
          notificacao_estoque_baixo?: boolean
          notificacao_email?: boolean
          notificacao_push?: boolean
          estoque_minimo_padrao?: number
          alerta_estoque_critico?: number
          backup_automatico?: boolean
          frequencia_backup?: string
          regime_tributario?: string | null
          inscricao_estadual?: string | null
          moeda?: string
          formato_data?: string
          dias_relatorio_padrao?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome_estabelecimento?: string | null
          email_contato?: string | null
          telefone?: string | null
          endereco?: string | null
          logo_url?: string | null
          notificacao_estoque_baixo?: boolean
          notificacao_email?: boolean
          notificacao_push?: boolean
          estoque_minimo_padrao?: number
          alerta_estoque_critico?: number
          backup_automatico?: boolean
          frequencia_backup?: string
          regime_tributario?: string | null
          inscricao_estadual?: string | null
          moeda?: string
          formato_data?: string
          dias_relatorio_padrao?: number
          created_at?: string
          updated_at?: string
        }
      }
      vendas: {
        Row: {
          id: string
          usuario_id: string
          numero_venda: string
          cliente_id: string | null
          data_venda: string
          total_produtos: number
          desconto: number
          valor_final: number
          forma_pagamento: string
          status: "aberta" | "finalizada" | "cancelada"
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          numero_venda?: string
          cliente_id?: string | null
          data_venda?: string
          total_produtos?: number
          desconto?: number
          valor_final?: number
          forma_pagamento?: string
          status?: "aberta" | "finalizada" | "cancelada"
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          numero_venda?: string
          cliente_id?: string | null
          data_venda?: string
          total_produtos?: number
          desconto?: number
          valor_final?: number
          forma_pagamento?: string
          status?: "aberta" | "finalizada" | "cancelada"
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      itens_venda: {
        Row: {
          id: string
          venda_id: string
          produto_id: string
          quantidade: number
          preco_unitario: number
          desconto_item: number
          valor_total: number
          created_at: string
        }
        Insert: {
          id?: string
          venda_id: string
          produto_id: string
          quantidade: number
          preco_unitario: number
          desconto_item?: number
          valor_total?: number
          created_at?: string
        }
        Update: {
          id?: string
          venda_id?: string
          produto_id?: string
          quantidade?: number
          preco_unitario?: number
          desconto_item?: number
          valor_total?: number
          created_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          usuario_id: string
          nome: string
          email: string | null
          telefone: string | null
          endereco: string | null
          cpf_cnpj: string | null
          tipo: "pessoa_fisica" | "pessoa_juridica" | "consumidor_final"
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          cpf_cnpj?: string | null
          tipo?: "pessoa_fisica" | "pessoa_juridica" | "consumidor_final"
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome?: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          cpf_cnpj?: string | null
          tipo?: "pessoa_fisica" | "pessoa_juridica" | "consumidor_final"
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_produto: "Cerveja" | "Refrigerante" | "Vinho" | "Destilado" | "Outros"
      tipo_movimentacao: "entrada" | "saida"
      motivo_entrada: "compra" | "devolucao" | "transferencia" | "ajuste"
      motivo_saida: "venda" | "degustacao" | "quebra" | "transferencia" | "ajuste"
      status_movimentacao: "pendente" | "concluida" | "cancelada"
    }
  }
}

// Tipos auxiliares
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"]
export type Produto = Database["public"]["Tables"]["produtos"]["Row"]
export type Movimentacao = Database["public"]["Tables"]["movimentacoes"]["Row"]
export type Configuracao = Database["public"]["Tables"]["configuracoes"]["Row"]
export type Venda = Database["public"]["Tables"]["vendas"]["Row"]
export type ItemVenda = Database["public"]["Tables"]["itens_venda"]["Row"]
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]

export type NovoUsuario = Database["public"]["Tables"]["usuarios"]["Insert"]
export type NovoProduto = Database["public"]["Tables"]["produtos"]["Insert"]
export type NovaMovimentacao = Database["public"]["Tables"]["movimentacoes"]["Insert"]
export type NovaConfiguracao = Database["public"]["Tables"]["configuracoes"]["Insert"]
export type NovaVenda = Database["public"]["Tables"]["vendas"]["Insert"]
export type NovoItemVenda = Database["public"]["Tables"]["itens_venda"]["Insert"]
export type NovoCliente = Database["public"]["Tables"]["clientes"]["Insert"]

export type AtualizarUsuario = Database["public"]["Tables"]["usuarios"]["Update"]
export type AtualizarProduto = Database["public"]["Tables"]["produtos"]["Update"]
export type AtualizarMovimentacao = Database["public"]["Tables"]["movimentacoes"]["Update"]
export type AtualizarConfiguracao = Database["public"]["Tables"]["configuracoes"]["Update"]
export type AtualizarVenda = Database["public"]["Tables"]["vendas"]["Update"]
export type AtualizarItemVenda = Database["public"]["Tables"]["itens_venda"]["Update"]
export type AtualizarCliente = Database["public"]["Tables"]["clientes"]["Update"]
