export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean | null
          cpf_cnpj: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: Json | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string | null
          data_abertura: string | null
          data_fechamento: string | null
          desconto: number | null
          forma_pagamento: string | null
          id: string
          mesa_id: string
          numero_comanda: string
          observacoes: string | null
          status: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          mesa_id: string
          numero_comanda: string
          observacoes?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          mesa_id?: string
          numero_comanda?: string
          observacoes?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          alerta_estoque_critico: number | null
          backup_automatico: boolean | null
          created_at: string | null
          dias_relatorio_padrao: number | null
          email_contato: string | null
          endereco: string | null
          estoque_minimo_padrao: number | null
          formato_data: string | null
          frequencia_backup: string | null
          id: string
          inscricao_estadual: string | null
          logo_url: string | null
          moeda: string | null
          nome_estabelecimento: string | null
          notificacao_email: boolean | null
          notificacao_estoque_baixo: boolean | null
          notificacao_push: boolean | null
          regime_tributario: string | null
          telefone: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          alerta_estoque_critico?: number | null
          backup_automatico?: boolean | null
          created_at?: string | null
          dias_relatorio_padrao?: number | null
          email_contato?: string | null
          endereco?: string | null
          estoque_minimo_padrao?: number | null
          formato_data?: string | null
          frequencia_backup?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          moeda?: string | null
          nome_estabelecimento?: string | null
          notificacao_email?: boolean | null
          notificacao_estoque_baixo?: boolean | null
          notificacao_push?: boolean | null
          regime_tributario?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          alerta_estoque_critico?: number | null
          backup_automatico?: boolean | null
          created_at?: string | null
          dias_relatorio_padrao?: number | null
          email_contato?: string | null
          endereco?: string | null
          estoque_minimo_padrao?: number | null
          formato_data?: string | null
          frequencia_backup?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          moeda?: string | null
          nome_estabelecimento?: string | null
          notificacao_email?: boolean | null
          notificacao_estoque_baixo?: boolean | null
          notificacao_push?: boolean | null
          regime_tributario?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionalidades: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          ordem_exibicao: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem_exibicao?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem_exibicao?: number | null
        }
        Relationships: []
      }
      plano_funcionalidades: {
        Row: {
          created_at: string | null
          funcionalidade_id: string
          id: string
          plano_id: string
        }
        Insert: {
          created_at?: string | null
          funcionalidade_id: string
          id?: string
          plano_id: string
        }
        Update: {
          created_at?: string | null
          funcionalidade_id?: string
          id?: string
          plano_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_funcionalidades_funcionalidade_id_fkey"
            columns: ["funcionalidade_id"]
            isOneToOne: false
            referencedRelation: "funcionalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_funcionalidades_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          desconto_percentual: number | null
          descricao: string | null
          duracao_meses: number
          id: string
          nome: string
          ordem_exibicao: number | null
          preco_mensal: number
          preco_total: number
          recursos: Json | null
          tem_teste_gratis: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          duracao_meses: number
          id?: string
          nome: string
          ordem_exibicao?: number | null
          preco_mensal: number
          preco_total: number
          recursos?: Json | null
          tem_teste_gratis?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          duracao_meses?: number
          id?: string
          nome?: string
          ordem_exibicao?: number | null
          preco_mensal?: number
          preco_total?: number
          recursos?: Json | null
          tem_teste_gratis?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string
          codigo_barras: string | null
          created_at: string | null
          data_validade: string | null
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          fornecedor: string | null
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          preco_compra: number | null
          preco_venda: number | null
          updated_at: string | null
          usuario_id: string
          volume: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          codigo_barras?: string | null
          created_at?: string | null
          data_validade?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome: string
          preco_compra?: number | null
          preco_venda?: number | null
          updated_at?: string | null
          usuario_id: string
          volume?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string | null
          data_validade?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome?: string
          preco_compra?: number | null
          preco_venda?: number | null
          updated_at?: string | null
          usuario_id?: string
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar_url: string | null
          cnpj_cpf: string | null
          created_at: string | null
          data_assinatura: string | null
          data_fim_teste: string | null
          data_inicio_teste: string | null
          data_vencimento: string | null
          em_periodo_teste: boolean | null
          email: string
          id: string
          nome: string
          nome_completo: string | null
          nome_estabelecimento: string | null
          plano_id: string | null
          role: string | null
          status_assinatura: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_fim_teste?: string | null
          data_inicio_teste?: string | null
          data_vencimento?: string | null
          em_periodo_teste?: boolean | null
          email: string
          id: string
          nome: string
          nome_completo?: string | null
          nome_estabelecimento?: string | null
          plano_id?: string | null
          role?: string | null
          status_assinatura?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_fim_teste?: string | null
          data_inicio_teste?: string | null
          data_vencimento?: string | null
          em_periodo_teste?: boolean | null
          email?: string
          id?: string
          nome?: string
          nome_completo?: string | null
          nome_estabelecimento?: string | null
          plano_id?: string | null
          role?: string | null
          status_assinatura?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para as tabelas
export type Plano = Database['public']['Tables']['planos']['Row']
export type NovoPlano = Database['public']['Tables']['planos']['Insert']
export type AtualizarPlano = Database['public']['Tables']['planos']['Update']

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type NovoUsuario = Database['public']['Tables']['usuarios']['Insert']
export type AtualizarUsuario = Database['public']['Tables']['usuarios']['Update']

export type Funcionalidade = Database['public']['Tables']['funcionalidades']['Row']
export type PlanoFuncionalidade = Database['public']['Tables']['plano_funcionalidades']['Row']

export type Produto = Database['public']['Tables']['produtos']['Row']
export type NovoProduto = Database['public']['Tables']['produtos']['Insert']
export type AtualizarProduto = Database['public']['Tables']['produtos']['Update']