# 🚀 Deploy Torneira Digital na Hostinger VPS

## 📋 **VISÃO GERAL**

Este guia explica como hospedar o projeto **Torneira Digital** na Hostinger VPS com Ubuntu 22.04 + Supabase integrado.

### ✅ **VANTAGENS DA HOSTINGER VPS:**
- **IP Público Fixo** (diferente da Vercel)
- **Controle total do servidor** Ubuntu 22.04
- **Supabase já integrado** na plataforma
- **Custo previsível** - plano fixo mensal
- **Performance dedicada** - recursos não compartilhados
- **Facilidade de configuração** - one-click apps

---

## 🛠️ **PASSO 1: CONFIGURAR VPS NA HOSTINGER**

### 1.1 Comprar VPS KVM
1. Acesse [hpanel.hostinger.com/vps](https://hpanel.hostinger.com/vps)
2. Clique em **"Compre agora"** no VPS KVM
3. Escolha o plano adequado (recomendado: **2 vCPU, 4GB RAM**)
4. Selecione **Ubuntu 22.04** como sistema operacional

### 1.2 Configurar SO com Aplicativo
1. Na tela "Escolha um sistema operacional"
2. Clique em **"SO com Aplicativo"**
3. Encontre e selecione **Supabase** na lista
4. Complete o processo de compra

---

## 🗄️ **PASSO 2: CONFIGURAR BANCO DE DADOS**

### 2.1 Acessar Supabase na VPS
1. Após o provisionamento da VPS, acesse o painel
2. Localize as credenciais do Supabase
3. Anote:
   - **URL do projeto**
   - **Chave anônima (anon key)**
   - **Chave de serviço (service key)**

### 2.2 Executar Script SQL
1. Acesse o **Supabase Dashboard** da sua VPS
2. Vá para **SQL Editor** ou **Database > Query**
3. Copie todo o conteúdo do arquivo [`database/torneira-digital-complete.sql`](../database/torneira-digital-complete.sql)
4. Cole no editor e execute o script
5. Verifique se todas as tabelas foram criadas com sucesso

### 2.3 Verificar Estrutura
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 💻 **PASSO 3: CONFIGURAR APLICAÇÃO**

### 3.1 Conectar via SSH
```bash
# Conectar na VPS (substituir IP)
ssh root@SEU_IP_DA_VPS

# Atualizar sistema
apt update && apt upgrade -y
```

### 3.2 Instalar Node.js e dependências
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2 para gerenciar processos
npm install -g pm2

# Instalar Git
apt install git -y
```

### 3.3 Clonar e configurar projeto
```bash
# Clonar repositório
cd /var/www
git clone https://github.com/SEU_USUARIO/Torneira-Digital.git
cd Torneira-Digital

# Instalar dependências
npm install

# Criar arquivo de ambiente
nano .env.local
```

### 3.4 Configurar variáveis de ambiente
Adicione no arquivo `.env.local`:

```env
# URLs do Supabase da sua VPS
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Para desenvolvimento
NODE_ENV=production
```

**📌 IMPORTANTE:** Substitua pelas credenciais reais do seu Supabase na VPS.

---

## 🚀 **PASSO 4: DEPLOY E CONFIGURAÇÃO**

### 4.1 Build da aplicação
```bash
# Fazer build de produção
npm run build

# Testar localmente
npm start
```

### 4.2 Configurar PM2
```bash
# Criar arquivo ecosystem
nano ecosystem.config.js
```

Conteúdo do `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'torneira-digital',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/Torneira-Digital',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 4.3 Iniciar aplicação
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

---

## 🌐 **PASSO 5: CONFIGURAR NGINX (OPCIONAL)**

### 5.1 Instalar e configurar Nginx
```bash
# Instalar Nginx
apt install nginx -y

# Criar configuração do site
nano /etc/nginx/sites-available/torneira-digital
```

### 5.2 Configuração Nginx
```nginx
server {
    listen 80;
    server_name SEU_IP_DA_VPS;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Ativar site
```bash
# Ativar site
ln -s /etc/nginx/sites-available/torneira-digital /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## 🔧 **PASSO 6: CONFIGURAÇÃO DE DOMÍNIO (OPCIONAL)**

### 6.1 Configurar DNS
Se você tem um domínio:
1. Acesse o painel de DNS do seu domínio
2. Crie um registro **A** apontando para o IP da VPS
3. Exemplo: `torneira.seudominio.com` → `IP_DA_VPS`

### 6.2 Configurar HTTPS com Let's Encrypt
```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
certbot --nginx -d seudominio.com

# Configurar renovação automática
crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **PASSO 7: MONITORAMENTO E LOGS**

### 7.1 Comandos úteis PM2
```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs torneira-digital

# Reiniciar aplicação
pm2 restart torneira-digital

# Parar aplicação
pm2 stop torneira-digital
```

### 7.2 Logs do sistema
```bash
# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -f
```

---

## 🔄 **PASSO 8: ATUALIZAÇÕES AUTOMÁTICAS**

### 8.1 Script de deploy
Crie um script para facilitar atualizações:

```bash
nano /var/www/deploy.sh
```

Conteúdo do script:
```bash
#!/bin/bash
cd /var/www/Torneira-Digital

# Fazer backup do .env
cp .env.local .env.backup

# Puxar atualizações
git pull origin main

# Reinstalar dependências se necessário
npm install

# Rebuild da aplicação
npm run build

# Restaurar .env
cp .env.backup .env.local

# Reiniciar aplicação
pm2 restart torneira-digital

echo "Deploy concluído!"
```

### 8.2 Tornar executável
```bash
chmod +x /var/www/deploy.sh

# Para atualizar no futuro:
/var/www/deploy.sh
```

---

## 🛡️ **PASSO 9: SEGURANÇA**

### 9.1 Configurar Firewall
```bash
# Instalar UFW
apt install ufw -y

# Configurar regras
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443

# Ativar firewall
ufw enable
```

### 9.2 Configurar Fail2Ban
```bash
# Instalar Fail2Ban
apt install fail2ban -y

# Configurar
nano /etc/fail2ban/jail.local
```

Conteúdo básico:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

---

## ✅ **CHECKLIST FINAL**

- [ ] VPS provisionada com Ubuntu 22.04 + Supabase
- [ ] Script SQL executado no Supabase
- [ ] Projeto clonado na VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Build da aplicação realizado
- [ ] PM2 configurado e aplicação rodando
- [ ] Nginx configurado (opcional)
- [ ] DNS configurado (se aplicável)
- [ ] SSL configurado (se aplicável)
- [ ] Firewall e segurança configurados
- [ ] Monitoramento ativo

---

## 🆘 **TROUBLESHOOTING**

### Problema: Build falha
```bash
# Verificar versão do Node
node --version  # Deve ser >= 18

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Aplicação não inicia
```bash
# Verificar logs
pm2 logs torneira-digital

# Verificar porta em uso
netstat -tulpn | grep 3000

# Reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js
```

### Problema: Erro de conexão com Supabase
1. Verificar URLs no `.env.local`
2. Testar conexão manual:
```bash
curl -I "https://SEU_PROJETO.supabase.co"
```

### Problema: Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar configuração Nginx
nginx -t

# Reiniciar serviços
pm2 restart all
systemctl restart nginx
```

---

## 📞 **SUPORTE**

- **Hostinger:** [help.hostinger.com](https://help.hostinger.com)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **PM2:** [pm2.keymetrics.io](https://pm2.keymetrics.io)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

---

## 💡 **DICAS EXTRAS**

1. **Backup regular:** Configure backup automático do banco
2. **Monitoramento:** Use ferramentas como Uptime Robot
3. **Performance:** Configure cache no Nginx para arquivos estáticos
4. **Segurança:** Mantenha sistema sempre atualizado
5. **Logs:** Configure rotação de logs para economizar espaço

---

**🎉 Parabéns! Seu Torneira Digital está rodando na Hostinger VPS!**

Acesse: `http://SEU_IP_DA_VPS` ou `https://seudominio.com`
