-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Storage policies
CREATE POLICY "Public access to images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');

CREATE POLICY "Admins can upload images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'images' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can delete images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'images' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
