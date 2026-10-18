import { type ImgHTMLAttributes } from "react";
import { ImageIcon } from "lucide-react";
import { useMediaUrl } from "@/hooks/useMediaUrl";

export default function MediaImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const { url, error } = useMediaUrl(typeof src === "string" ? src : null);
  if (!url || error) return <div className={props.className}><div className="flex h-full items-center justify-center bg-card text-muted-foreground"><ImageIcon className="h-8 w-8" /></div></div>;
  return <img {...props} src={url} />;
}