-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "storage";

-- Ensure the storage schema exists
CREATE SCHEMA IF NOT EXISTS "storage";

-- Create the storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    "bucket_id" TEXT,
    "name" TEXT,
    "owner" UUID REFERENCES auth.users(id),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_accessed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "metadata" JSONB,
    UNIQUE("bucket_id", "name")
);

-- Create the storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "owner" UUID REFERENCES auth.users(id),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "public" BOOLEAN DEFAULT FALSE
);

-- Set up RLS
ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;

-- Create policies for buckets
CREATE POLICY "Bucket access for authenticated users" ON "storage"."buckets"
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Create policies for objects
CREATE POLICY "Object access for authenticated users" ON "storage"."objects"
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

