-- Adicionar coluna updated_at se não existir nas tabelas principais
DO $$ 
BEGIN 
    -- Tabela users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Tabela videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='updated_at') THEN
        ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Tabela clips
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clips' AND column_name='updated_at') THEN
        ALTER TABLE clips ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Tabela channels
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='updated_at') THEN
        ALTER TABLE channels ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Tabela user_settings (se já existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_settings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='updated_at') THEN
            ALTER TABLE user_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Criar função para auto-update se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers para manter a data atualizada automaticamente
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_videos ON videos;
CREATE TRIGGER set_timestamp_videos BEFORE UPDATE ON videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_clips ON clips;
CREATE TRIGGER set_timestamp_clips BEFORE UPDATE ON clips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_channels ON channels;
CREATE TRIGGER set_timestamp_channels BEFORE UPDATE ON channels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
