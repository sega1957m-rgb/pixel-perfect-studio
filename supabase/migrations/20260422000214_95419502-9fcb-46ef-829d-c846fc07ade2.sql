UPDATE storage.buckets
SET file_size_limit = 19327352832,
    public = true,
    allowed_mime_types = ARRAY[
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-matroska',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'application/octet-stream'
    ]
WHERE id = 'videos';