-- Run once in your Supabase project's SQL Editor as the project owner.
-- Adds access only to the signed-in user's chat JSON and assistant profile.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads') THEN
    RAISE EXCEPTION 'The existing private uploads bucket is missing. Restore it before applying this migration.';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads' AND public) THEN
    RAISE EXCEPTION 'The uploads bucket must be private before saving chats.';
  END IF;
END $$;

-- Preserve the document upload allowlist, adding JSON only when needed.
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/json')
WHERE id = 'uploads' AND allowed_mime_types IS NOT NULL
  AND NOT ('application/json' = ANY(allowed_mime_types))
  AND NOT ('application/*' = ANY(allowed_mime_types))
  AND NOT ('*/*' = ANY(allowed_mime_types));

-- A repeatable migration: only these three chat policies are replaced.
DROP POLICY IF EXISTS resumate_chat_select_own ON storage.objects;
DROP POLICY IF EXISTS resumate_chat_insert_own ON storage.objects;
DROP POLICY IF EXISTS resumate_chat_update_own ON storage.objects;

CREATE POLICY resumate_chat_select_own ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  (name = auth.uid()::text || '/chat-profile.json' OR
    ((storage.foldername(name))[2] = 'chat' AND
     array_length(storage.foldername(name), 1) = 2 AND storage.extension(name) = 'json'))
);

CREATE POLICY resumate_chat_insert_own ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  (name = auth.uid()::text || '/chat-profile.json' OR
    ((storage.foldername(name))[2] = 'chat' AND
     array_length(storage.foldername(name), 1) = 2 AND storage.extension(name) = 'json'))
);

CREATE POLICY resumate_chat_update_own ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  (name = auth.uid()::text || '/chat-profile.json' OR
    ((storage.foldername(name))[2] = 'chat' AND
     array_length(storage.foldername(name), 1) = 2 AND storage.extension(name) = 'json'))
)
WITH CHECK (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  (name = auth.uid()::text || '/chat-profile.json' OR
    ((storage.foldername(name))[2] = 'chat' AND
     array_length(storage.foldername(name), 1) = 2 AND storage.extension(name) = 'json'))
);

COMMIT;
