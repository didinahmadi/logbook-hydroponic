"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { usePlants } from "@/hooks/usePlants";
import { createBatch } from "@/services/batches";
import type { GrowingMethod, PlantStageStatus } from "@/types";
import {
  GROWING_METHOD_LABELS, GROWING_METHODS,
  PLANT_STAGE_LABELS, PLANT_STAGES,
} from "@/utils/labels";

export default function NewBatchPage() {
  const router = useRouter();
  const { plants, loading: plantsLoading } = usePlants();

  const [name, setName] = useState("");
  const [plantId, setPlantId] = useState("");
  const [seedDate, setSeedDate] = useState(new Date().toISOString().split("T")[0]);
  const [holeCount, setHoleCount] = useState("");
  const [growingMethod, setGrowingMethod] = useState<GrowingMethod>("hydroponic");
  const [currentStage, setCurrentStage] = useState<PlantStageStatus>("seedling");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plantId) {
      toast.error("Pilih jenis tanaman");
      return;
    }
    setSaving(true);
    try {
      await createBatch({
        name,
        plant_id: plantId,
        seed_date: seedDate,
        hole_count: parseInt(holeCount) || 0,
        growing_method: growingMethod,
        current_stage: currentStage,
      });
      toast.success("Batch berhasil dibuat!");
      router.push("/batches");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
    setSaving(false);
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/batches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Baru</h1>
            <p className="text-sm text-gray-500">Mulai batch tanam baru</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Batch</Label>
                <Input
                  id="name"
                  placeholder="contoh: Polybag Cabe 1, NFT Pakcoy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Tanaman</Label>
                <Select value={plantId} onValueChange={(v) => setPlantId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <span className={plantId ? "text-foreground" : "text-muted-foreground"}>
                      {plantId
                        ? plants.find((p) => p.id === plantId)?.name
                        : plantsLoading ? "Memuat..." : "Pilih tanaman"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Metode Tanam</Label>
                  <Select value={growingMethod} onValueChange={(v) => setGrowingMethod((v ?? "hydroponic") as GrowingMethod)}>
                    <SelectTrigger className="w-full">
                      <span className="text-foreground">
                        {GROWING_METHOD_LABELS[growingMethod]}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GROWING_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {GROWING_METHOD_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fase Awal</Label>
                  <Select value={currentStage} onValueChange={(v) => setCurrentStage((v ?? "seedling") as PlantStageStatus)}>
                    <SelectTrigger className="w-full">
                      <span className="text-foreground">
                        {PLANT_STAGE_LABELS[currentStage]}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {PLANT_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PLANT_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seedDate">Tanggal Semai</Label>
                <Input
                  id="seedDate"
                  type="date"
                  value={seedDate}
                  onChange={(e) => setSeedDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holeCount">Jumlah Unit (lubang/pot/polybag)</Label>
                <Input
                  id="holeCount"
                  type="number"
                  min="0"
                  placeholder="contoh: 20"
                  value={holeCount}
                  onChange={(e) => setHoleCount(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Buat Batch"}
                </Button>
                <Link href="/batches">
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
