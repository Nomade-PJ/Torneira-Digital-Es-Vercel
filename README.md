# 🚀 Torneira Digital

Sistema completo de gestão empresarial com integração híbrida de pagamentos via Asaas.

## ✨ Funcionalidades

- **💰 Gestão de Vendas** - Controle completo de transações
- **📦 Controle de Estoque** - Gerenciamento de produtos e estoque  
- **💳 Pagamentos Híbridos** - Integração direta com Asaas (PIX, Cartão, Boleto)
- **📊 Fluxo de Caixa** - Acompanhamento financeiro em tempo real
- **📈 Relatórios** - Dashboards e análises detalhadas
- **⚙️ Configurações** - Personalização completa do sistema

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Pagamentos**: Asaas (Solução Híbrida)
- **UI/UX**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel

## 🚀 Instalação e Configuração

### 1. **Clone o projeto**
```bash
git clone https://github.com/seu-usuario/torneira-digital.git
cd torneira-digital
```

### 2. **Instale as dependências**
```bash
npm install
```

### 3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Asaas (Opcional - para webhooks)
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
```

### 4. **Execute o projeto**
```bash
npm run dev
```

## 💳 Integração com Asaas

Este projeto utiliza a **Solução Híbrida Asaas** para processar pagamentos:

- ✅ **Redirecionamento direto** para checkout Asaas
- ✅ **Webhook automático** para ativação de contas
- ✅ **Suporte completo** a PIX, Cartão e Boleto
- ✅ **Criação automática** de usuários pós-pagamento

Para configurar os pagamentos, consulte: **[INTEGRACAO.md](./INTEGRACAO.md)**

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas principais
├── lib/                # Utilitários e configurações
│   ├── supabase.ts     # Cliente Supabase
│   └── asaas-links.ts  # Links de pagamento Asaas
├── hooks/              # Hooks customizados
└── types/              # Definições TypeScript

api/
└── webhooks/
    └── asaas.ts        # Webhook para processar pagamentos
```

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) habilitado
- ✅ Validação de dados no frontend e backend
- ✅ Tokens de webhook protegidos
- ✅ HTTPS obrigatório em produção

## 📊 Fluxo de Pagamento

1. **Cliente** seleciona plano na plataforma
2. **Redirecionamento** direto para checkout Asaas
3. **Pagamento** processado pelo Asaas
4. **Webhook** confirma pagamento e ativa conta
5. **Email** enviado com dados de acesso
6. **Cliente** acessa sistema com credenciais

## 🌐 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Variáveis de Ambiente na Vercel
Configure no painel da Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ASAAS_WEBHOOK_TOKEN`

## 📞 Suporte

- **Email**: contato@torneira.digital
- **Documentação**: [INTEGRACAO.md](./INTEGRACAO.md)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/torneira-digital/issues)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar a gestão do seu negócio**