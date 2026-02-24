-- Atomic credit single consumption for authenticated users
CREATE OR REPLACE FUNCTION public.consume_single_credit()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
  user_id UUID;
BEGIN
  -- Get the current authenticated user inside the Security Definer context
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Attempt to deduct exactly 1 credit if balance >= 1
  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = user_id AND credits >= 1
  RETURNING credits INTO new_credits;

  -- If no rows were updated, either user doesn't exist or balance is 0
  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  RETURN new_credits;
END;
$$;

-- Grant execute permissions to standard users
REVOKE ALL ON FUNCTION public.consume_single_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_single_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_single_credit() TO service_role;
