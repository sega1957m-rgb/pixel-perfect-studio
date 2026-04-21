-- 1. Add video_category enum and column
CREATE TYPE public.video_category AS ENUM ('Scene', 'BTS', 'Interview', 'Bonus Scene', 'Bloopers', 'Striptease', 'Photoshoot');

ALTER TABLE public.videos
  ADD COLUMN category public.video_category NOT NULL DEFAULT 'Scene';

-- 2. Restrict SELECT on content tables to authenticated users only
DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.albums;
CREATE POLICY "Authenticated users can view albums"
  ON public.albums FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.photos;
CREATE POLICY "Authenticated users can view photos"
  ON public.photos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
CREATE POLICY "Authenticated users can view videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Studios are viewable by everyone" ON public.studios;
CREATE POLICY "Authenticated users can view studios"
  ON public.studios FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Studio-albums viewable by everyone" ON public.studio_albums;
CREATE POLICY "Authenticated users can view studio_albums"
  ON public.studio_albums FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Studio-videos viewable by everyone" ON public.studio_videos;
CREATE POLICY "Authenticated users can view studio_videos"
  ON public.studio_videos FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow photo updates by admins (for individual edits later)
CREATE POLICY "Admins can update photos"
  ON public.photos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));