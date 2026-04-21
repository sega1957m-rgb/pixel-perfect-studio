update storage.buckets
set file_size_limit = 5368709120,
    allowed_mime_types = array[
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
      'video/mpeg',
      'video/ogg'
    ]
where id = 'videos';