-- Studios table
CREATE TABLE public.studios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studios are viewable by everyone" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Admins can insert studios" ON public.studios FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update studios" ON public.studios FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete studios" ON public.studios FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_studios_updated_at
BEFORE UPDATE ON public.studios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Many-to-many: studios <-> videos
CREATE TABLE public.studio_videos (
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (studio_id, video_id)
);

ALTER TABLE public.studio_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio-videos viewable by everyone" ON public.studio_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert studio-videos" ON public.studio_videos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete studio-videos" ON public.studio_videos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Many-to-many: studios <-> albums
CREATE TABLE public.studio_albums (
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (studio_id, album_id)
);

ALTER TABLE public.studio_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio-albums viewable by everyone" ON public.studio_albums FOR SELECT USING (true);
CREATE POLICY "Admins can insert studio-albums" ON public.studio_albums FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete studio-albums" ON public.studio_albums FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for studio covers
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-covers', 'studio-covers', true);

CREATE POLICY "Studio covers publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'studio-covers');
CREATE POLICY "Admins upload studio covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'studio-covers' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update studio covers" ON storage.objects FOR UPDATE USING (bucket_id = 'studio-covers' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete studio covers" ON storage.objects FOR DELETE USING (bucket_id = 'studio-covers' AND has_role(auth.uid(), 'admin'::app_role));