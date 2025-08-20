# 🍺 Torneira Digital - Sistema PDV & ERP

Sistema completo de **Ponto de Venda (PDV)** e **ERP** desenvolvido especificamente para bares, restaurantes, cervejarias e estabelecimentos comerciais. Uma solução moderna e intuitiva para gestão completa do seu negócio.

![Status](https://img.shields.io/badge/Status-Ativo-green) ![Versão](https://img.shields.io/badge/Versão-2.0.0-blue) ![React](https://img.shields.io/badge/React-18+-blue) ![Vite](https://img.shields.io/badge/Vite-5+-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## ✨ **Principais Diferenciais**

- 🎨 **Interface Moderna:** Design intuitivo e responsivo
- ⚡ **Performance Otimizada:** Carregamento rápido e fluido
- 🔐 **Segurança Avançada:** Autenticação robusta e proteção de dados
- 📱 **Multi-plataforma:** Funciona em desktop, tablet e mobile
- 🖨️ **Impressão Profissional:** Notas fiscais no padrão NFC
- 🔄 **Tempo Real:** Sincronização instantânea entre dispositivos

## 🎯 **Funcionalidades Principais**

### 🛒 **PDV - Ponto de Venda**
- **Vendas Diretas:** Sistema de balcão rápido com impressão automática de cupons
- **Controle de Mesas:** Gestão visual intuitiva (Livre/Ocupada/Reservada/Manutenção)  
- **Sistema de Comandas:** Números personalizáveis, dados completos do cliente
- **Múltiplas Formas de Pagamento:** Dinheiro, PIX, Cartão de Débito/Crédito, Transferência
- **Sistema de Descontos:** Flexível para vendas diretas e comandas
- **Carrinho Inteligente:** Adição rápida de produtos com busca e categorização

### 📦 **Gestão de Estoque**
- **Catálogo Completo:** Produtos com fotos, preços, categorias e variações
- **Controle de Estoque:** Monitoramento em tempo real (atual, mínimo, crítico)
- **Scanner de Códigos:** Leitor de código de barras integrado
- **Alertas Inteligentes:** Notificações automáticas de estoque baixo/crítico
- **Fornecedores:** Cadastro e gestão de fornecedores
- **Histórico:** Rastreamento completo de movimentações

### 📊 **Relatórios e Analytics**
- **Dashboard Executivo:** KPIs principais em tempo real
- **Análise de Vendas:** Receita, produtos vendidos, ticket médio
- **Gráficos Interativos:** Vendas por período, produtos mais vendidos
- **Relatórios Detalhados:** Exportação em PDF profissional
- **Análise de Performance:** Produtos, categorias e períodos
- **Fluxo de Caixa:** Controle financeiro completo

## 🚀 **Instalação**

```bash
git clone https://github.com/Nomade-PJ/Torneira-Digital-Es-Vercel.git
cd Torneira-Digital-Es-Vercel
npm install
```

### 🔧 **Configuração de Ambiente**

#### **Pré-requisitos:**
- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (opcional para deploy)

#### **Configuração do Banco de Dados:**
1. **Crie um projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave anônima do projeto

2. **Configure as variáveis de ambiente:**
   ```bash
   # Crie um arquivo .env.local na raiz do projeto:
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

3. **Execute o projeto:**
   ```bash
   npm run dev
   ```

## 🚀 **Deploy na Vercel**

### **Método Automático (Recomendado):**
1. **Fork este repositório** para sua conta GitHub
2. **Conecte à Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Importe seu fork do repositório
   - Configure as variáveis de ambiente (Supabase URL e Key)
   - Deploy automático! 🎉

### **Configuração das Variáveis:**
No painel da Vercel, adicione as variáveis de ambiente:
```
VITE_SUPABASE_URL = [sua_url_do_supabase]
VITE_SUPABASE_ANON_KEY = [sua_chave_anonima]
```

### **Deploy Manual:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🛠️ **Tecnologias**

- ⚛️ **React 18** - Biblioteca JavaScript
- ⚡ **Vite 5** - Build tool moderna
- 🗄️ **Supabase** - Backend completo
- 🎨 **Tailwind CSS** - Estilização  
- 📊 **Recharts** - Gráficos
- 🔐 **RLS** - Segurança de dados
- 📱 **Radix UI** - Componentes acessíveis

## 📱 **Recursos Avançados**

### 🖨️ **Sistema de Impressão**
- **Impressão Térmica:** Cupons automáticos no padrão NFC brasileiro
- **Notas Profissionais:** Layout similar ao cupom fiscal eletrônico
- **Suporte Múltiplo:** Impressoras térmicas 80mm
- **Preview Visual:** Visualização antes da impressão

### 🔐 **Segurança e Autenticação**
- **Login Seguro:** Sistema de autenticação robusto
- **Recuperação de Senha:** Via email com validação
- **Proteção de Dados:** Criptografia end-to-end
- **Controle de Acesso:** Níveis de permissão por usuário

### 📊 **Dashboard Inteligente**
- **KPIs em Tempo Real:** Vendas, receita, produtos
- **Gráficos Interativos:** Análise visual de performance
- **Alertas Automáticos:** Estoque baixo, metas atingidas
- **Relatórios Personalizáveis:** Exportação em PDF

## 🎨 **Screenshots**

*Em breve: Capturas de tela do sistema em funcionamento*

## 🤝 **Contribuição**

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 **Suporte**

- 📧 **Email:** [seu-email@exemplo.com]
- 💬 **Discord:** [Link do servidor]
- 📱 **WhatsApp:** [Seu número]
- 🐛 **Issues:** [GitHub Issues](https://github.com/Nomade-PJ/Torneira-Digital-Es-Vercel/issues)

## 🏆 **Roadmap**

### 🔄 **Próximas Versões:**
- [ ] **App Mobile Nativo** (React Native)
- [ ] **Integração com APIs** de pagamento (Mercado Pago, PagSeguro)
- [ ] **Sistema de Delivery** integrado
- [ ] **Programa de Fidelidade** para clientes
- [ ] **Análise Avançada** com IA
- [ ] **Multi-loja** - Gestão de múltiplos estabelecimentos

---

## ⭐ **Se este projeto foi útil, deixe uma estrela!**

**Transforme seu estabelecimento hoje mesmo!** 🚀

*Desenvolvido para a comunidade brasileira de bares e restaurantes*
