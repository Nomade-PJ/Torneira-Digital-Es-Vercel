import { supabase } from "@/lib/supabase"

// Cliente wrapper que contorna problemas de tipagem do Supabase
export const db = {
  // Wrapper para select
  select: (table: string) => ({
    from: (columns: string = "*") => ({
      eq: (column: string, value: any) => ({
        order: (orderColumn: string, options?: { ascending?: boolean }) => ({
          limit: (limitValue: number) => ({
            single: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options).single(),
            maybeSingle: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options).maybeSingle(),
            execute: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options).limit(limitValue)
          }),
          single: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options).single(),
          maybeSingle: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options).maybeSingle(),
          execute: () => (supabase as any).from(table).select(columns).eq(column, value).order(orderColumn, options)
        }),
        limit: (limitValue: number) => ({
          execute: () => (supabase as any).from(table).select(columns).eq(column, value).limit(limitValue)
        }),
        single: () => (supabase as any).from(table).select(columns).eq(column, value).single(),
        maybeSingle: () => (supabase as any).from(table).select(columns).eq(column, value).maybeSingle(),
        execute: () => (supabase as any).from(table).select(columns).eq(column, value)
      }),
      where: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          order: (orderColumn: string, options?: { ascending?: boolean }) => ({
            limit: (limitValue: number) => ({
              execute: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).order(orderColumn, options).limit(limitValue)
            }),
            single: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).order(orderColumn, options).single(),
            maybeSingle: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).order(orderColumn, options).maybeSingle(),
            execute: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).order(orderColumn, options)
          }),
          single: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).single(),
          maybeSingle: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2).maybeSingle(),
          execute: () => (supabase as any).from(table).select(columns).eq(column, value).eq(column2 as any, value2)
        })
      }),
      order: (orderColumn: string, options?: { ascending?: boolean }) => ({
        limit: (limitValue: number) => ({
          execute: () => (supabase as any).from(table).select(columns).order(orderColumn, options).limit(limitValue)
        }),
        execute: () => (supabase as any).from(table).select(columns).order(orderColumn, options)
      }),
      limit: (limitValue: number) => ({
        execute: () => (supabase as any).from(table).select(columns).limit(limitValue)
      }),
      execute: () => (supabase as any).from(table).select(columns)
    })
  }),

  // Wrapper para insert
  insert: (table: string) => ({
    values: (data: any) => ({
      select: (columns: string = "*") => ({
        single: () => (supabase as any).from(table).insert(data).select(columns).single()
      }),
      execute: () => (supabase as any).from(table).insert(data)
    })
  }),

  // Wrapper para update  
  update: (table: string) => ({
    set: (data: any) => ({
      where: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          select: (columns: string = "*") => ({
            single: () => (supabase as any).from(table).update(data).eq(column, value).eq(column2 as any, value2).select(columns).single()
          }),
          execute: () => (supabase as any).from(table).update(data).eq(column, value).eq(column2 as any, value2)
        }),
        execute: () => (supabase as any).from(table).update(data).eq(column, value)
      })
    })
  })
}

// Tipos simplificados que evitam conflitos
export interface SimpleUser {
  id: string
  email: string
  user_metadata?: {
    nome_estabelecimento?: string
    nome?: string
    cnpj_cpf?: string
    telefone?: string
  }
}

export interface SimpleProduto {
  id: string
  usuario_id: string
  nome: string
  marca?: string | null
  volume?: string | null
  categoria: string
  estoque_atual: number
  estoque_minimo: number
  preco_compra: number
  preco_venda: number
  ativo: boolean
  created_at: string
  updated_at: string
  [key: string]: any
}

export interface SimpleMovimentacao {
  id: string
  usuario_id: string
  produto_id: string
  tipo: "entrada" | "saida"
  motivo: string
  quantidade: number
  preco_unitario: number
  valor_total?: number
  responsavel: string
  fornecedor?: string | null
  observacao?: string | null
  status: "pendente" | "concluida" | "cancelada"
  data_movimentacao: string
  created_at: string
  updated_at: string
  produtos?: {
    nome: string
    marca: string | null
    categoria: string
    ativo: boolean
  }
  [key: string]: any
}
