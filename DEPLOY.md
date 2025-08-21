# 🚀 Deploy no Vercel - Torneira Digital

## 📋 Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Projeto do GitHub conectado
- Variáveis de ambiente configuradas

## ⚙️ Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

### 🗄️ Supabase
```
VITE_SUPABASE_URL=https://gkwdspvvpucuoeupxnny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2RzcHZ2cHVjdW9ldXB4bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjczMzEsImV4cCI6MjA2OTkwMzMzMX0.QyiBYqQIlegSfv8UKVR3gQRchaR_C23_6M78RNLumzk
```

### 📱 WhatsApp (CallMeBot)
```
VITE_WHATSAPP_PHONE=5598992022352
VITE_WHATSAPP_API_KEY=9967405
```

## 🛠️ Passos para Deploy

### 1. Via Vercel Dashboard
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente (Settings > Environment Variables)
5. Deploy será automático

### 2. Via CLI (alternativa)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Configurar variáveis durante o processo
```

## 📁 Configuração Automática

O projeto já possui:
- ✅ `vercel.json` configurado
- ✅ Script de build: `npm run build`
- ✅ Redirecionamento SPA
- ✅ Variáveis com fallbacks

## 🔒 Segurança

- ✅ Chaves sensíveis via environment variables
- ✅ RLS ativo no Supabase
- ✅ Validação CPF/CNPJ
- ✅ Headers de segurança

## 🌐 Domínio Personalizado

Para usar domínio próprio:
1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure DNS apontando para Vercel

## ⚡ Otimizações

- ✅ Build otimizado com Terser
- ✅ Tree shaking automático
- ✅ Compressão gzip
- ✅ Cache de assets

## 🔍 Monitoramento

Após deploy, verifique:
- [ ] WhatsApp funciona
- [ ] Cadastro sem telefone
- [ ] Login/registro
- [ ] Validação CPF/CNPJ
- [ ] Supabase conectado

## 🆘 Troubleshooting

### Erro: Environment variables não carregam
```bash
# Verificar se estão prefixadas com VITE_
VITE_SUPABASE_URL=...
```

### Erro: Build falha
```bash
# Testar build local
npm run build
```

### Erro: Supabase não conecta
- Verificar RLS policies
- Confirmar URL e chave
- Testar no browser devtools

---

**🎯 Projeto pronto para produção!**
