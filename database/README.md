# 🗄️ Banco de Dados - Torneira Digital

## 📋 **VISÃO GERAL**

Este diretório contém os scripts SQL completos para configurar o banco de dados do **Torneira Digital** em qualquer ambiente Supabase.

## 📁 **ARQUIVOS**

### `torneira-digital-complete.sql`
Script SQL completo contendo:
- ✅ **7 tabelas principais** com relacionamentos
- ✅ **Índices otimizados** para performance
- ✅ **Triggers automáticos** para timestamps
- ✅ **Row Level Security (RLS)** completo
- ✅ **Políticas de segurança** por usuário
- ✅ **Funções auxiliares** (numeração automática)
- ✅ **Views para estatísticas** rápidas
- ✅ **Dados de exemplo** (opcional)

## 🏗️ **ESTRUTURA DO BANCO**

### Relacionamentos
```
usuarios (1) ──→ (N) configuracoes
usuarios (1) ──→ (N) clientes  
usuarios (1) ──→ (N) produtos
usuarios (1) ──→ (N) vendas
usuarios (1) ──→ (N) movimentacoes

vendas (1) ──→ (N) itens_venda
produtos (1) ──→ (N) itens_venda
produtos (1) ──→ (N) movimentacoes
clientes (1) ──→ (N) vendas
```

### Tabelas Principais

#### 1. **usuarios**
- Cadastro de usuários do sistema
- Chave primária para isolamento de dados
- Suporte a autenticação Supabase

#### 2. **configuracoes**
- Configurações personalizadas por usuário
- Alertas de estoque
- Preferências do estabelecimento

#### 3. **clientes**
- Cadastro de clientes
- Informações de contato
- Vinculado às vendas

#### 4. **produtos**
- Catálogo de produtos
- Controle de estoque
- Preços e categorias

#### 5. **vendas**
- Registro de vendas
- Formas de pagamento
- Totais e descontos

#### 6. **itens_venda**
- Detalhamento dos itens vendidos
- Quantidades e preços unitários
- Vinculado a vendas e produtos

#### 7. **movimentacoes**
- Histórico de entrada/saída de estoque
- Rastreabilidade completa
- Motivos das movimentações

## 🚀 **COMO USAR**

### Para Supabase (Vercel/Hostinger)
1. Acesse o **SQL Editor** do Supabase
2. Copie o conteúdo de `torneira-digital-complete.sql`
3. Cole no editor e execute
4. Verifique se todas as tabelas foram criadas

### Para PostgreSQL Local
```bash
# Via psql
psql -U usuario -d database -f torneira-digital-complete.sql

# Via Docker
docker exec -i postgres_container psql -U usuario -d database < torneira-digital-complete.sql
```

## 🔐 **SEGURANÇA (RLS)**

### Políticas Implementadas
Cada usuário só acessa seus próprios dados:

- ✅ **Usuários:** Veem apenas seu perfil
- ✅ **Configurações:** Isoladas por usuário
- ✅ **Clientes:** Privados por usuário
- ✅ **Produtos:** Catálogo individual
- ✅ **Vendas:** Histórico privado
- ✅ **Itens de Venda:** Vinculados às vendas do usuário
- ✅ **Movimentações:** Isoladas por usuário

### Autenticação
```sql
-- Exemplo de política RLS
CREATE POLICY "Usuários podem gerenciar seus produtos" ON produtos
    FOR ALL USING (auth.uid() = usuario_id);
```

## 📊 **PERFORMANCE**

### Índices Criados
- **Email de usuários** - Login rápido
- **Produtos por usuário** - Listagem otimizada
- **Vendas por data** - Relatórios rápidos
- **Códigos de barras** - Busca instantânea
- **Status de vendas** - Filtros eficientes

### Views Otimizadas
- `estatisticas_usuario` - Dashboard rápido
- Agregações pré-calculadas
- Joins otimizados

## 🔧 **FUNCIONALIDADES AVANÇADAS**

### Triggers Automáticos
- **Timestamps:** Auto-update em modificações
- **Numeração:** Número de venda automático
- **Validações:** Consistência de dados

### Funções Auxiliares
```sql
-- Gerar número de venda único
gerar_numero_venda() -- VND-20250120-1642123456

-- Atualizar timestamp
update_updated_at() -- Automático em updates
```

## 🧪 **DADOS DE TESTE**

O script inclui dados de exemplo (comentados):
- Usuário de teste
- Produtos básicos (cervejas, refrigerantes)
- Configurações padrão

Para ativar, descomente a seção "DADOS DE EXEMPLO" no script.

## 🔄 **MIGRATIONS FUTURAS**

### Versionamento
```sql
-- Sempre adicionar versão no início do script
-- Versão: 1.0 - Script inicial
-- Versão: 1.1 - Adição de campo X
-- Versão: 1.2 - Otimização de índices
```

### Backup Antes de Alterações
```sql
-- Backup de tabela específica
CREATE TABLE produtos_backup AS SELECT * FROM produtos;

-- Backup completo
pg_dump database_name > backup_$(date +%Y%m%d).sql
```

## ❓ **FAQ**

### P: Como resetar o banco?
R: Execute as linhas DROP TABLE no início do script e rode novamente.

### P: Como adicionar novos campos?
R: Use ALTER TABLE com cuidado, sempre com backup.

### P: RLS não funciona?
R: Verifique se `auth.uid()` retorna o ID correto do usuário.

### P: Performance lenta?
R: Verifique se os índices estão sendo usados com EXPLAIN ANALYZE.

## 📞 **SUPORTE**

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL:** [postgresql.org/docs](https://postgresql.org/docs)
- **RLS Guide:** [supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

**🎯 Script testado e otimizado para produção!**
