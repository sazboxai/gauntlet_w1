-- Remove any existing RLS policies on the files table
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view files in their channels" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

-- Allow all authenticated users to insert files
CREATE POLICY "Authenticated users can insert files"
ON public.files FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to select files
CREATE POLICY "Authenticated users can select files"
ON public.files FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow all authenticated users to update files
CREATE POLICY "Authenticated users can update files"
ON public.files FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
ON public.files FOR DELETE
USING (auth.role() = 'authenticated');

-- Update storage bucket policies
UPDATE storage.buckets
SET public = true
WHERE name = 'public';

-- Allow authenticated users to insert objects into the public bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');

-- Allow public read access to all files in the public bucket
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their own files"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE
USING (auth.uid() = owner);

