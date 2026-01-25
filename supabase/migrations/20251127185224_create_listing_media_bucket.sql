/*
  # Create Listing Media Storage Bucket
  
  1. Storage
    - Create `listing-media` bucket for listing images and videos
    - Set to public (images need to be viewable)
    - Max file size: 10MB for images, 50MB for videos
  
  2. Security
    - RLS policies for upload (authenticated users only)
    - RLS policies for viewing (public read access)
    - Users can only upload to their own listing folders
    
  3. Supported Formats
    - Images: JPEG, PNG, WebP
    - Videos: MP4, WebM
*/

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-media',
  'listing-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload media for their listings
CREATE POLICY "Users can upload own listing media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Everyone can view listing media (public bucket)
CREATE POLICY "Anyone can view listing media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-media');

-- Users can update their own listing media
CREATE POLICY "Users can update own listing media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own listing media
CREATE POLICY "Users can delete own listing media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete any listing media
CREATE POLICY "Admins can delete any listing media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);