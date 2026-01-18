-- Add credits column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

-- Update the handle_new_user function to give 5 credits by default
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, credits)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing users with 200 credits
UPDATE profiles
SET credits = 200
WHERE credits = 0;
