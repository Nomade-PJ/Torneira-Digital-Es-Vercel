import { supabase } from "@/lib/supabase"

// Cliente wrapper que contorna problemas de tipagem do Supabase
export const db = {
  // Wrapper para select
  select: (table: string) => ({
    from: (columns: string = "*") => ({
      eq: (column: string, value: any) => ({
        order: (orderColumn: string, options?: { ascending?: boolean }) => ({
          limit: (limitValue: number) => ({
            single: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options).single(),
            maybeSingle: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options).maybeSingle(),
            execute: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options).limit(limitValue)
          }),
          single: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options).single(),
          maybeSingle: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options).maybeSingle(),
          execute: () => supabase.from(table).select(columns).eq(column as any, value).order(orderColumn as any, options)
        }),
        limit: (limitValue: number) => ({
          execute: () => supabase.from(table).select(columns).eq(column as any, value).limit(limitValue)
        }),
        single: () => supabase.from(table).select(columns).eq(column as any, value).single(),
        maybeSingle: () => supabase.from(table).select(columns).eq(column as any, value).maybeSingle(),
        execute: () => supabase.from(table).select(columns).eq(column as any, value)
      }),
      where: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          order: (orderColumn: string, options?: { ascending?: boolean }) => ({
            limit: (limitValue: number) => ({
              execute: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).order(orderColumn as any, options).limit(limitValue)
            }),
            single: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).order(orderColumn as any, options).single(),
            maybeSingle: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).order(orderColumn as any, options).maybeSingle(),
            execute: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).order(orderColumn as any, options)
          }),
          single: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).single(),
          maybeSingle: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2).maybeSingle(),
          execute: () => supabase.from(table).select(columns).eq(column as any, value).eq(column2 as any, value2)
        })
      }),
      order: (orderColumn: string, options?: { ascending?: boolean }) => ({
        limit: (limitValue: number) => ({
          execute: () => supabase.from(table).select(columns).order(orderColumn as any, options).limit(limitValue)
        }),
        execute: () => supabase.from(table).select(columns).order(orderColumn as any, options)
      }),
      limit: (limitValue: number) => ({
        execute: () => supabase.from(table).select(columns).limit(limitValue)
      }),
      execute: () => supabase.from(table).select(columns)
    })
  }),

  // Wrapper para insert
  insert: (table: string) => ({
    values: (data: any) => ({
      select: (columns: string = "*") => ({
        single: () => supabase.from(table).insert(data).select(columns).single()
      }),
      execute: () => supabase.from(table).insert(data)
    })
  }),

  // Wrapper para update  
  update: (table: string) => ({
    set: (data: any) => ({
      where: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          select: (columns: string = "*") => ({
            single: () => supabase.from(table).update(data).eq(column as any, value).eq(column2 as any, value2).select(columns).single()
          }),
          execute: () => supabase.from(table).update(data).eq(column as any, value).eq(column2 as any, value2)
        }),
        execute: () => supabase.from(table).update(data).eq(column as any, value)
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
