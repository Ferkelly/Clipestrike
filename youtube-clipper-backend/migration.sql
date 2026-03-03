-- TABELA DE CONFIGURAÇÕES DO USUÁRIO
CREATE TABLE IF NOT EXISTS user_settings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notifications JSONB DEFAULT '{
    "clipGenerated": true,
    "newVideo": true,
    "errors": true,
    "newsletter": false
  }',
  plan          TEXT DEFAULT 'free',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Política para que o usuário veja apenas suas próprias configurações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'own_settings' AND tablename = 'user_settings'
    ) THEN
        CREATE POLICY "own_settings" ON user_settings USING (user_id = auth.uid());
    END IF;
END $$;
