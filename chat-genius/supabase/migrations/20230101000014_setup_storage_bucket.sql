-- Create a new public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable public access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'public' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'public'
);

-- Allow users to update and delete their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner );

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING ( auth.uid() = owner );

