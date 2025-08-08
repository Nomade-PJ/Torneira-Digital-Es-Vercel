# 🔧 Configuração do Git e Deploy para GitHub

## Passos para configurar o repositório e fazer deploy:

### 1. Inicializar Git (se ainda não foi feito)
```bash
git init
git branch -M main
```

### 2. Configurar o remote do GitHub
```bash
git remote add origin https://github.com/Nomade-PJ/Torneira-Digital.git
```

### 3. Configurar usuário Git (se necessário)
```bash
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### 4. Adicionar todos os arquivos
```bash
git add .
```

### 5. Fazer commit inicial
```bash
git commit -m "🎉 Initial commit: Torneira Digital v1.0.0

✨ Features:
- PDV completo com carrinho de compras
- Gestão de estoque com movimentações
- Relatórios e analytics avançados
- Sistema de usuários e autenticação
- Interface mobile-first responsiva
- Performance ultra-otimizada

🔧 Tech Stack:
- Next.js 15 + React 19
- TypeScript + Tailwind CSS v4
- Supabase (Auth + Database)
- Shadcn/ui components
- Vercel deployment ready

🚀 Production Ready:
- 100% TypeScript sem erros
- Cache inteligente implementado
- Mobile navigation corrigida
- Vercel configurado
- CI/CD pipeline
- SEO otimizado"
```

### 6. Enviar para GitHub
```bash
git push -u origin main
```

### 7. Configurar deploy na Vercel

Acesse [vercel.com](https://vercel.com) e:

1. **Import do GitHub**: Selecione o repositório `Nomade-PJ/Torneira-Digital`
2. **Configure as variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
3. **Deploy**: Clique em "Deploy"

### 8. Configurar domínio personalizado (opcional)

Na Vercel, vá em:
- Project Settings → Domains
- Adicione seu domínio customizado

---

## ✅ Checklist de Deploy

- [ ] Git inicializado
- [ ] Remote configurado
- [ ] Commit feito
- [ ] Push para GitHub realizado
- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Site acessível e funcionando

## 🔗 Links Úteis

- **Repositório**: https://github.com/Nomade-PJ/Torneira-Digital
- **Deploy Vercel**: Será gerado após o deploy
- **Supabase Dashboard**: https://supabase.com/dashboard

## 🚨 Importante

Certifique-se de que:
1. O Supabase está configurado com as tabelas e RLS
2. As variáveis de ambiente estão corretas
3. O domínio do Vercel está adicionado nas configurações do Supabase (Auth → Site URL)

---

**🎉 Após seguir esses passos, seu projeto estará live na internet!**
