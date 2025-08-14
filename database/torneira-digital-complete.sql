-- =================================================
-- SCRIPT SQL COMPLETO - TORNEIRA DIGITAL
-- =================================================
-- Para usar na Hostinger VPS + Supabase
-- Data: 2025-01-20
-- Versão: 1.0
-- =================================================

-- Limpar tabelas existentes (se necessário)
DROP TABLE IF EXISTS itens_venda CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS movimentacoes CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =================================================
-- 1. TABELA DE USUÁRIOS
-- =================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome_estabelecimento VARCHAR(200),
    cnpj_cpf VARCHAR(20),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 2. TABELA DE CONFIGURAÇÕES
-- =================================================
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_estabelecimento VARCHAR(200) NOT NULL DEFAULT 'Meu Estabelecimento',
    email_contato VARCHAR(255),
    telefone VARCHAR(20),
    notificacao_estoque_baixo BOOLEAN DEFAULT true,
    notificacao_email BOOLEAN DEFAULT true,
    estoque_minimo_padrao INTEGER DEFAULT 20,
    alerta_estoque_critico INTEGER DEFAULT 5,
    backup_automatico BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- =================================================
-- 3. TABELA DE CLIENTES
-- =================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 4. TABELA DE PRODUTOS
-- =================================================
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    categoria VARCHAR(100) NOT NULL,
    codigo_barras VARCHAR(50),
    preco_compra DECIMAL(10,2) DEFAULT 0,
    preco_venda DECIMAL(10,2) NOT NULL,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 20,
    volume VARCHAR(20),
    data_validade DATE,
    fornecedor VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 5. TABELA DE VENDAS
-- =================================================
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id),
    numero_venda VARCHAR(50) UNIQUE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50) DEFAULT 'dinheiro',
    status VARCHAR(20) DEFAULT 'finalizada',
    observacoes TEXT,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 6. TABELA DE ITENS DA VENDA
-- =================================================
CREATE TABLE itens_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    desconto_item DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 7. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- =================================================
CREATE TABLE movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(100),
    observacoes TEXT,
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_configuracoes_usuario ON configuracoes(usuario_id);
CREATE INDEX idx_clientes_usuario ON clientes(usuario_id);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
CREATE INDEX idx_produtos_usuario ON produtos(usuario_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_vendas_usuario ON vendas(usuario_id);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_itens_venda_venda ON itens_venda(venda_id);
CREATE INDEX idx_itens_venda_produto ON itens_venda(produto_id);
CREATE INDEX idx_movimentacoes_usuario ON movimentacoes(usuario_id);
CREATE INDEX idx_movimentacoes_produto ON movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao);

-- =================================================
-- 9. TRIGGERS PARA AUTO-UPDATE
-- =================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_configuracoes_updated_at
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_vendas_updated_at
    BEFORE UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =================================================
-- 10. ROW LEVEL SECURITY (RLS) - POLÍTICAS
-- =================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA USUÁRIOS
CREATE POLICY "Usuários podem ver seus próprios dados" ON usuarios
    FOR ALL USING (auth.uid() = id);

-- POLÍTICAS PARA CONFIGURAÇÕES
CREATE POLICY "Usuários podem ver suas configurações" ON configuracoes
    FOR ALL USING (auth.uid() = usuario_id);

-- POLÍTICAS PARA CLIENTES
CREATE POLICY "Usuários podem gerenciar seus clientes" ON clientes
    FOR ALL USING (auth.uid() = usuario_id);

-- POLÍTICAS PARA PRODUTOS
CREATE POLICY "Usuários podem gerenciar seus produtos" ON produtos
    FOR ALL USING (auth.uid() = usuario_id);

-- POLÍTICAS PARA VENDAS
CREATE POLICY "Usuários podem gerenciar suas vendas" ON vendas
    FOR ALL USING (auth.uid() = usuario_id);

-- POLÍTICAS PARA ITENS DE VENDA
CREATE POLICY "Usuários podem ver itens de suas vendas" ON itens_venda
    FOR ALL USING (
        auth.uid() IN (
            SELECT usuario_id FROM vendas WHERE id = venda_id
        )
    );

-- POLÍTICAS PARA MOVIMENTAÇÕES
CREATE POLICY "Usuários podem gerenciar suas movimentações" ON movimentacoes
    FOR ALL USING (auth.uid() = usuario_id);

-- =================================================
-- 11. DADOS DE EXEMPLO (OPCIONAL)
-- =================================================
-- Descomentar se quiser dados de teste
/*
-- Usuário de exemplo
INSERT INTO usuarios (id, nome, email, nome_estabelecimento, cnpj_cpf)
VALUES (
    '12345678-1234-1234-1234-123456789012',
    'João Silva',
    'joao@exemplo.com',
    'Bar do João',
    '12.345.678/0001-90'
);

-- Configuração padrão
INSERT INTO configuracoes (usuario_id, nome_estabelecimento, email_contato)
VALUES (
    '12345678-1234-1234-1234-123456789012',
    'Bar do João',
    'joao@exemplo.com'
);

-- Produtos de exemplo
INSERT INTO produtos (usuario_id, nome, marca, categoria, preco_venda, estoque_atual)
VALUES 
    ('12345678-1234-1234-1234-123456789012', 'Cerveja Heineken 350ml', 'Heineken', 'Cerveja', 4.50, 50),
    ('12345678-1234-1234-1234-123456789012', 'Refrigerante Coca-Cola 350ml', 'Coca-Cola', 'Refrigerante', 3.00, 30),
    ('12345678-1234-1234-1234-123456789012', 'Água Mineral 500ml', 'Crystal', 'Água', 2.00, 100);
*/

-- =================================================
-- 12. FUNÇÕES AUXILIARES
-- =================================================

-- Função para gerar número de venda automático
CREATE OR REPLACE FUNCTION gerar_numero_venda()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_venda IS NULL THEN
        NEW.numero_venda := 'VND-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_venda
    BEFORE INSERT ON vendas
    FOR EACH ROW EXECUTE FUNCTION gerar_numero_venda();

-- =================================================
-- 13. VIEWS ÚTEIS (OPCIONAL)
-- =================================================

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW estatisticas_usuario AS
SELECT 
    u.id as usuario_id,
    u.nome,
    COUNT(DISTINCT p.id) as total_produtos,
    COUNT(DISTINCT c.id) as total_clientes,
    COUNT(DISTINCT v.id) as total_vendas,
    COALESCE(SUM(v.total), 0) as receita_total,
    COUNT(DISTINCT CASE WHEN v.data_venda::date = CURRENT_DATE THEN v.id END) as vendas_hoje,
    COALESCE(SUM(CASE WHEN v.data_venda::date = CURRENT_DATE THEN v.total ELSE 0 END), 0) as receita_hoje
FROM usuarios u
LEFT JOIN produtos p ON u.id = p.usuario_id AND p.ativo = true
LEFT JOIN clientes c ON u.id = c.usuario_id AND c.ativo = true
LEFT JOIN vendas v ON u.id = v.usuario_id AND v.status = 'finalizada'
GROUP BY u.id, u.nome;

-- =================================================
-- SCRIPT FINALIZADO! 
-- =================================================
-- Para usar na Hostinger:
-- 1. Copie todo este script
-- 2. Cole no Supabase Query Editor
-- 3. Execute o script completo
-- 4. Configure as variáveis de ambiente no seu projeto
-- =================================================

COMMENT ON TABLE usuarios IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE configuracoes IS 'Configurações personalizadas por usuário';
COMMENT ON TABLE clientes IS 'Cadastro de clientes dos estabelecimentos';
COMMENT ON TABLE produtos IS 'Catálogo de produtos com controle de estoque';
COMMENT ON TABLE vendas IS 'Registro de todas as vendas realizadas';
COMMENT ON TABLE itens_venda IS 'Itens individuais de cada venda';
COMMENT ON TABLE movimentacoes IS 'Histórico de movimentações de estoque';

-- Fim do script
