"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createDailyLog, type PhotoInput } from "@/services/batches";
import type { GrowingMethod, SoilCondition, ApplicationMethod } from "@/types";
import {
  SOIL_CONDITION_LABELS, SOIL_CONDITIONS,
  APPLICATION_METHOD_LABELS, APPLICATION_METHODS,
} from "@/utils/labels";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 5;

interface PhotoPreview extends PhotoInput {
  preview: string;
}

interface AddLogDialogProps {
  batchId: string;
  growingMethod?: GrowingMethod;
  onSuccess: () => void;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}

export function AddLogDialog({ batchId, growingMethod = "hydroponic", onSuccess }: AddLogDialogProps) {
  const [open, setOpen] = useState(false);
  const isHydroponic = growingMethod === "hydroponic";

  // Hydroponic fields
  const [ppm, setPpm] = useState("");
  const [ph, setPh] = useState("");

  // Observation
  const [heightCm, setHeightCm] = useState("");
  const [soilCondition, setSoilCondition] = useState<SoilCondition | null>(null);

  // Watering
  const [wateredToday, setWateredToday] = useState(false);
  const [waterAmount, setWaterAmount] = useState("");

  // Fertilizer
  const [fertilizerName, setFertilizerName] = useState("");
  const [fertilizerAmount, setFertilizerAmount] = useState("");
  const [applicationMethod, setApplicationMethod] = useState<ApplicationMethod | null>(null);

  // Problem
  const [problemName, setProblemName] = useState("");
  const [treatment, setTreatment] = useState("");

  // Note + photos
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    setPhotos((prev) => [
      ...prev,
      ...valid.map((file) => ({
        file,
        description: "",
        preview: URL.createObjectURL(file),
      })),
    ]);
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
    setPpm(""); setPh("");
    setHeightCm(""); setSoilCondition(null);
    setWateredToday(false); setWaterAmount("");
    setFertilizerName(""); setFertilizerAmount(""); setApplicationMethod(null);
    setProblemName(""); setTreatment("");
    setNote(""); setPhotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDailyLog({
        batch_id: batchId,
        ppm_actual: ppm ? parseFloat(ppm) : null,
        ph_actual: ph ? parseFloat(ph) : null,
        note: note || null,
        watered_today: wateredToday || null,
        water_amount_ml: waterAmount ? parseInt(waterAmount) : null,
        soil_condition: soilCondition,
        plant_height_cm: heightCm ? parseFloat(heightCm) : null,
        fertilizer_name: fertilizerName || null,
        fertilizer_amount: fertilizerAmount || null,
        application_method: applicationMethod,
        problem_name: problemName || null,
        treatment: treatment || null,
        photos: photos.length > 0 ? photos : undefined,
      });
      toast.success("Log berhasil ditambahkan");
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
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

          {/* Pengamatan */}
          <SectionHeader title="Pengamatan" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Tinggi Tanaman (cm)</Label>
              <Input id="height" type="number" step="0.1" min="0" placeholder="25.5"
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            {!isHydroponic && (
              <div className="space-y-1.5">
                <Label>Kondisi Tanah</Label>
                <div className="flex gap-1">
                  {SOIL_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSoilCondition(soilCondition === c ? null : c)}
                      className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                        soilCondition === c
                          ? "bg-green-100 border-green-400 text-green-800 font-medium"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {SOIL_CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nutrisi (hydroponic only) */}
          {isHydroponic && (
            <>
              <SectionHeader title="Nutrisi" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ppm">PPM Aktual</Label>
                  <Input id="ppm" type="number" step="1" min="0" placeholder="950"
                    value={ppm} onChange={(e) => setPpm(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph">pH Aktual</Label>
                  <Input id="ph" type="number" step="0.1" min="0" max="14" placeholder="6.4"
                    value={ph} onChange={(e) => setPh(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Penyiraman */}
          <SectionHeader title="Penyiraman" />
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wateredToday}
                onChange={(e) => {
                  setWateredToday(e.target.checked);
                  if (!e.target.checked) setWaterAmount("");
                }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Sudah disiram hari ini</span>
            </label>
            {wateredToday && (
              <div className="space-y-1.5">
                <Label htmlFor="waterAmount">Jumlah Air (ml, opsional)</Label>
                <Input id="waterAmount" type="number" min="0" placeholder="500"
                  value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} />
              </div>
            )}
          </div>

          {/* Pemupukan */}
          <SectionHeader title="Pemupukan" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fertName">Nama Pupuk (opsional)</Label>
              <Input id="fertName" placeholder="NPK, Gandasil, dll."
                value={fertilizerName} onChange={(e) => setFertilizerName(e.target.value)} />
            </div>
            {fertilizerName && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fertAmount">Dosis</Label>
                  <Input id="fertAmount" placeholder="2 gram/liter"
                    value={fertilizerAmount} onChange={(e) => setFertilizerAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cara Aplikasi</Label>
                  <div className="flex gap-2">
                    {APPLICATION_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setApplicationMethod(applicationMethod === m ? null : m)}
                        className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                          applicationMethod === m
                            ? "bg-blue-100 border-blue-400 text-blue-800 font-medium"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {APPLICATION_METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Masalah */}
          <SectionHeader title="Masalah & Penanganan" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="problem">Masalah yang Ditemukan (opsional)</Label>
              <Input id="problem" placeholder="Daun menguning, hama kutu, dll."
                value={problemName} onChange={(e) => setProblemName(e.target.value)} />
            </div>
            {problemName && (
              <div className="space-y-1.5">
                <Label htmlFor="treatment">Penanganan</Label>
                <Textarea id="treatment" placeholder="Langkah penanganan yang dilakukan..."
                  value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={2} />
              </div>
            )}
          </div>

          {/* Foto */}
          <SectionHeader title="Foto" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{photos.length}/{MAX_PHOTOS} foto</span>
              {photos.length < MAX_PHOTOS && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <Camera className="h-3.5 w-3.5" /> Ambil Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> Pilih dari Galeri
                  </button>
                </div>
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {photos.length === 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg py-5 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex flex-col items-center gap-1"
                >
                  <Camera className="h-5 w-5" />
                  <span>Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg py-5 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex flex-col items-center gap-1"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span>Galeri (maks. {MAX_PHOTOS})</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {photos.map((photo, i) => (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-lg p-2">
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt="" className="w-14 h-14 object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 truncate">{photo.file.name}</p>
                      <Input
                        placeholder="Deskripsi (opsional)"
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

          {/* Catatan */}
          <SectionHeader title="Catatan" />
          <div className="space-y-1.5">
            <Textarea
              placeholder="Catatan tambahan tentang kondisi hari ini..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Log"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
