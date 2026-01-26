-- Lock down profile updates so authenticated users cannot change credits
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE (credits) ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;

-- Track processed webhook events for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Atomic credit increment
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN new_credits;
END;
$$;

-- Atomic credit decrement with insufficient check
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  RETURN new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_credits(UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_credits(UUID, INTEGER) TO service_role;
