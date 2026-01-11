-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('recipe-images', 'recipe-images', true),
    ('step-images', 'step-images', true),
    ('original-scans', 'original-scans', true),
    ('avatars', 'avatars', true);

-- Storage policies for recipe-images bucket
CREATE POLICY "Users can upload own recipe images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'recipe-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Recipe images are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can delete own recipe images" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'recipe-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for step-images bucket
CREATE POLICY "Users can upload own step images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'step-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Step images are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'step-images');

CREATE POLICY "Users can delete own step images" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'step-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for original-scans bucket
CREATE POLICY "Users can upload own scans" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'original-scans' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Scans are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'original-scans');

CREATE POLICY "Users can delete own scans" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'original-scans' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Avatars are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
