"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createDailyLog, type PhotoInput } from "@/services/batches";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 5;

interface PhotoPreview extends PhotoInput {
  preview: string;
}

interface AddLogDialogProps {
  batchId: string;
  onSuccess: () => void;
}

export function AddLogDialog({ batchId, onSuccess }: AddLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [ppm, setPpm] = useState("");
  const [ph, setPh] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      toast.error(`File melebihi batas ${MAX_SIZE_MB}MB: ${oversized.map((f) => f.name).join(", ")}`);
    }

    const valid = toAdd.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
    const newPhotos: PhotoPreview[] = valid.map((file) => ({
      file,
      description: "",
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so the same file can be re-selected if removed
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateDescription(index: number, value: string) {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description: value } : p))
    );
  }

  function resetForm() {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPpm(""); setPh(""); setNote(""); setPhotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDailyLog({
        batch_id: batchId,
        ppm_actual: parseFloat(ppm),
        ph_actual: parseFloat(ph),
        note: note || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      toast.success("Log berhasil ditambahkan");
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors">
        <ImagePlus className="h-4 w-4" /> Tambah Log
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Harian</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PPM & pH inline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ppm">PPM Aktual</Label>
              <Input id="ppm" type="number" step="1" min="0" placeholder="950"
                value={ppm} onChange={(e) => setPpm(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">pH Aktual</Label>
              <Input id="ph" type="number" step="0.1" min="0" max="14" placeholder="6.4"
                value={ph} onChange={(e) => setPh(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Textarea id="note" placeholder="Kondisi tanaman hari ini..."
              value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          {/* Photo section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Foto ({photos.length}/{MAX_PHOTOS})</Label>
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Tambah Foto
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex flex-col items-center gap-1"
              >
                <ImagePlus className="h-6 w-6" />
                <span>Klik untuk tambah foto (maks. {MAX_PHOTOS})</span>
                <span className="text-xs">JPG, PNG, WebP · Maks {MAX_SIZE_MB}MB/foto</span>
              </button>
            ) : (
              <div className="space-y-3">
                {photos.map((photo, i) => (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-lg p-2">
                    {/* Thumbnail */}
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 truncate">{photo.file.name}</p>
                      <Input
                        placeholder="Deskripsi foto (opsional)"
                        value={photo.description}
                        onChange={(e) => updateDescription(i, e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Log"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
