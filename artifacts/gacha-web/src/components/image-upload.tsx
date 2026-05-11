import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Gambar" }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const token = localStorage.getItem("gacha_token");
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Upload gagal");
      }
      const { url } = await resp.json();
      onChange(url);
      toast.success("Gambar berhasil diupload");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const preview = value
    ? value.startsWith("/api/uploads/")
      ? `http://localhost:8080${value}`
      : value
    : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => setMode("upload")}
          className="h-7 text-xs"
        >
          <Upload className="w-3 h-3 mr-1" />
          Upload File
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "url" ? "default" : "outline"}
          onClick={() => setMode("url")}
          className="h-7 text-xs"
        >
          <Link className="w-3 h-3 mr-1" />
          Pakai URL
        </Button>
      </div>

      {mode === "upload" ? (
        <div
          className={cn(
            "border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/20",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Mengupload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Klik untuk pilih gambar</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP, GIF — maks 5MB</p>
            </div>
          )}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.png"
        />
      )}

      {preview && (
        <div className="relative w-full rounded-lg border border-border overflow-hidden bg-secondary/20">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x128/1a1a2e/FFD700?text=Preview"; }}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
            onClick={() => onChange("")}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
