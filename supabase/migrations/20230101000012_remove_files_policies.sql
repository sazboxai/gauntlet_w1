-- Drop existing policies on the files table
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view files in their channels" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

-- Disable RLS on the files table
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;

-- Grant all privileges on the files table to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.files TO authenticated;

-- Grant usage on the files_id_seq sequence to authenticated users
GRANT USAGE, SELECT ON SEQUENCE files_id_seq TO authenticated;

