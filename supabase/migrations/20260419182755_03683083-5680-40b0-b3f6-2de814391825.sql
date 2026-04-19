-- Recreate video_quality enum with new values (remove 'Studio', add 'Full HD' and 'SD')
ALTER TYPE public.video_quality RENAME TO video_quality_old;

CREATE TYPE public.video_quality AS ENUM ('4K', 'Full HD', 'HD', 'SD');

-- Migrate existing data: 'Studio' -> 'HD' as fallback
ALTER TABLE public.videos 
  ALTER COLUMN quality DROP DEFAULT;

ALTER TABLE public.videos
  ALTER COLUMN quality TYPE public.video_quality
  USING (
    CASE quality::text
      WHEN 'Studio' THEN 'HD'::public.video_quality
      ELSE quality::text::public.video_quality
    END
  );

ALTER TABLE public.videos
  ALTER COLUMN quality SET DEFAULT 'HD'::public.video_quality;

DROP TYPE public.video_quality_old;