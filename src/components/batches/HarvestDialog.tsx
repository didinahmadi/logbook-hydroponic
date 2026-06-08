"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createHarvest } from "@/services/batches";

interface HarvestDialogProps {
  batchId: string;
  onSuccess: () => void;
}

export function HarvestDialog({ batchId, onSuccess }: HarvestDialogProps) {
  const [open, setOpen] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createHarvest({
        batch_id: batchId,
        weight_kg: parseFloat(weightKg),
        note: note || undefined,
      });
      toast.success("Panen berhasil dicatat!");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors">
        <Leaf className="h-4 w-4" /> Catat Panen
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Catat Panen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Berat Hasil Panen (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.001"
              min="0"
              placeholder="contoh: 1.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Textarea
              id="note"
              placeholder="Kondisi panen, catatan khusus..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={saving}>
            {saving ? "Menyimpan..." : "Catat Panen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
