# 🍺 Torneira Digital

Sistema completo de gestão de estoque para estabelecimentos, desenvolvido com Next.js 15, React 19, Supabase e Tailwind CSS.

## ✨ Funcionalidades

- 🏪 **PDV (Ponto de Venda)** - Sistema de vendas completo
- 📦 **Gestão de Estoque** - Controle total de produtos e movimentações
- 📊 **Relatórios Avançados** - Analytics e dashboards
- 👥 **Gestão de Clientes** - Cadastro e histórico
- ⚙️ **Configurações** - Personalização do sistema
- 📱 **Mobile First** - Totalmente responsivo e otimizado para dispositivos móveis
- ⚡ **Performance Ultra-Rápida** - Carregamento em milissegundos

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS v4, Shadcn/ui
- **State Management**: Context API, Custom Hooks
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Build/Deploy**: Vercel

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Passo a passo

1. **Clone o repositório**
   \`\`\`bash
   git clone https://github.com/Nomade-PJ/Torneira-Digital.git
   cd Torneira-Digital
   \`\`\`

2. **Instale as dependências**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo \`.env.local\` na raiz do projeto:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   \`\`\`

4. **Execute o projeto**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Acesse**
   
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 🔧 Configuração do Supabase

### Tabelas necessárias

Execute os seguintes comandos SQL no seu projeto Supabase:

\`\`\`sql
-- Tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  nome_estabelecimento TEXT,
  cnpj_cpf TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  nome TEXT NOT NULL,
  marca TEXT,
  volume TEXT,
  categoria TEXT NOT NULL,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 10,
  preco_compra DECIMAL(10,2) DEFAULT 0,
  preco_venda DECIMAL(10,2) DEFAULT 0,
  fornecedor TEXT,
  descricao TEXT,
  codigo_barras TEXT,
  data_validade DATE,
  ativo BOOLEAN DEFAULT true,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outras tabelas (movimentacoes, vendas, etc.)
-- Execute o script completo disponível em /sql/schema.sql
\`\`\`

### RLS (Row Level Security)

Habilite RLS e configure as políticas necessárias para segurança dos dados.

## 📱 Deploy na Vercel

### Deploy Automático

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nomade-PJ/Torneira-Digital)

### Deploy Manual

1. **Fork este repositório**

2. **Conecte com Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Import seu fork do GitHub

3. **Configure as variáveis de ambiente**
   
   No painel da Vercel, adicione:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`

4. **Deploy!**

## 🎯 Funcionalidades Detalhadas

### 🏪 PDV (Ponto de Venda)
- Interface intuitiva para vendas
- Busca rápida de produtos
- Carrinho de compras
- Múltiplas formas de pagamento
- Impressão de recibos

### 📦 Gestão de Estoque
- CRUD completo de produtos
- Controle de movimentações (entrada/saída)
- Alertas de estoque baixo
- Histórico completo
- Categories e filtros

### 📊 Relatórios
- Dashboard com métricas
- Gráficos de vendas
- Relatórios de estoque
- Análise de performance
- Exportação para PDF

### 📱 Mobile Experience
- Design responsivo
- Navegação touch-friendly
- Performance otimizada
- PWA ready
- Suporte iOS/Android

## 🔧 Scripts Disponíveis

\`\`\`bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm run start

# Linting
npm run lint
\`\`\`

## 🏗️ Estrutura do Projeto

\`\`\`
torneira-digital/
├── app/                    # App Router (Next.js 15)
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Páginas principais
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn)
│   └── providers/        # Context providers
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
├── types/                # Definições TypeScript
└── public/              # Assets estáticos
\`\`\`

## 🎨 Tema e Design

- **Design System**: Baseado em Shadcn/ui
- **Cores**: Tema âmbar/dourado (cervejaria)
- **Tipografia**: Geist (Vercel)
- **Ícones**: Lucide React
- **Animações**: Tailwind CSS + Framer Motion

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS)
- Headers de segurança configurados
- Validação de dados com Zod
- Sanitização de inputs

## 📈 Performance

- **Core Web Vitals** otimizados
- Server-side rendering (SSR)
- Static generation quando possível
- Lazy loading de componentes
- Compressão de assets
- Cache inteligente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: suporte@torneira-digital.com
- 💬 Discord: [Comunidade Torneira Digital](https://discord.gg/torneira-digital)
- 📚 Documentação: [docs.torneira-digital.com](https://docs.torneira-digital.com)

## 🎉 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Vercel](https://vercel.com/) - Plataforma de deploy

---

**Desenvolvido com ❤️ para revolucionar a gestão de estabelecimentos!**