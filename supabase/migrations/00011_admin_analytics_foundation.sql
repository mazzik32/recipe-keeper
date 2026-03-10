-- Analytics foundation for admin reporting
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_direction') THEN
    CREATE TYPE public.credit_transaction_direction AS ENUM ('grant', 'consume', 'adjustment');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_source') THEN
    CREATE TYPE public.credit_transaction_source AS ENUM (
      'signup_bonus',
      'iap_ios',
      'iap_android',
      'paddle',
      'scan_consume',
      'admin_adjustment'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_user_type') THEN
    CREATE TYPE public.analytics_user_type AS ENUM ('anonymous', 'registered', 'unknown');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction public.credit_transaction_direction NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source public.credit_transaction_source NOT NULL,
  source_reference TEXT,
  pack_code TEXT,
  user_type_snapshot public.analytics_user_type NOT NULL DEFAULT 'unknown',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_transactions_source_reference_unique UNIQUE NULLS NOT DISTINCT (source, source_reference)
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id_created_at
  ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
  ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_source_created_at
  ON public.credit_transactions(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_pack_code_created_at
  ON public.credit_transactions(pack_code, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_type_snapshot public.analytics_user_type NOT NULL DEFAULT 'unknown',
  channel TEXT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  event_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_events_event_key_unique UNIQUE NULLS NOT DISTINCT (event_name, event_key)
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_occurred_at
  ON public.analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_occurred_at
  ON public.analytics_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_recipe_id_occurred_at
  ON public.analytics_events(recipe_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_channel_occurred_at
  ON public.analytics_events(channel, occurred_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.admin_credit_sales_rollups AS
SELECT
  date_trunc('day', created_at) AS bucket_day,
  source,
  pack_code,
  user_type_snapshot,
  COUNT(*) FILTER (WHERE direction = 'grant') AS grant_transaction_count,
  COALESCE(SUM(amount) FILTER (WHERE direction = 'grant'), 0) AS granted_credits,
  COUNT(*) FILTER (WHERE direction = 'consume') AS consume_transaction_count,
  COALESCE(SUM(amount) FILTER (WHERE direction = 'consume'), 0) AS consumed_credits
FROM public.credit_transactions
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW public.admin_usage_rollups AS
SELECT
  date_trunc('day', occurred_at) AS bucket_day,
  event_name,
  channel,
  user_type_snapshot,
  COUNT(*) AS event_count
FROM public.analytics_events
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW public.admin_kpi_rollups AS
SELECT
  current_date AS snapshot_date,
  (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
  (SELECT COUNT(*) FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE COALESCE(u.is_anonymous, FALSE)) AS anonymous_profiles,
  (SELECT COUNT(*) FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE NOT COALESCE(u.is_anonymous, FALSE)) AS registered_profiles,
  (SELECT COUNT(*) FROM public.recipes) AS total_recipes,
  (SELECT COALESCE(SUM(credits), 0) FROM public.profiles) AS outstanding_credits;

CREATE OR REPLACE VIEW public.admin_funnel_rollups AS
SELECT
  date_trunc('day', occurred_at) AS bucket_day,
  user_type_snapshot,
  COUNT(*) FILTER (WHERE event_name = 'anonymous_session_created') AS anonymous_session_created_count,
  COUNT(*) FILTER (WHERE event_name = 'user_registered') AS user_registered_count,
  COUNT(*) FILTER (WHERE event_name = 'recipe_created') AS recipe_created_count,
  COUNT(*) FILTER (WHERE event_name = 'purchase_completed') AS purchase_completed_count
FROM public.analytics_events
GROUP BY 1, 2;
