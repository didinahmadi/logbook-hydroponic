"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, ZoomIn } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useBatch } from "@/hooks/useBatches";
import { useBatchPhotos } from "@/hooks/useDailyLogs";
import { getSignedPhotoUrl } from "@/services/batches";
import type { LogPhotoWithDate } from "@/types";

interface ResolvedPhoto extends LogPhotoWithDate {
  url: string;
}

function groupByDate(photos: ResolvedPhoto[]): [string, ResolvedPhoto[]][] {
  const map = new Map<string, ResolvedPhoto[]>();
  for (const photo of photos) {
    const dateKey = photo.log_date.split("T")[0];
    const existing = map.get(dateKey) ?? [];
    map.set(dateKey, [...existing, photo]);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const { batch } = useBatch(batchId);
  const { photos: rawPhotos, loading } = useBatchPhotos(batchId);
  const [resolved, setResolved] = useState<ResolvedPhoto[]>([]);
  const [lightbox, setLightbox] = useState<ResolvedPhoto | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!rawPhotos.length) return;
    setResolving(true);
    Promise.all(
      rawPhotos.map(async (p) => ({
        ...p,
        url: await getSignedPhotoUrl(p.storage_path),
      }))
    ).then((data) => {
      setResolved(data);
      setResolving(false);
    });
  }, [rawPhotos]);

  const grouped = groupByDate(resolved);
  const totalPhotos = rawPhotos.length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/batches/${batchId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galeri Foto</h1>
            {batch && (
              <p className="text-sm text-gray-500">
                {batch.name} · {totalPhotos} foto
              </p>
            )}
          </div>
        </div>

        {loading || resolving ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : totalPhotos === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Belum ada foto untuk batch ini.</p>
            <p className="text-sm mt-1">Tambah foto saat mencatat log harian.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dateKey, photos]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  {format(new Date(dateKey + "T00:00:00"), "d MMMM yyyy", { locale: id })}
                  <span className="ml-2 font-normal text-gray-400">({photos.length} foto)</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightbox(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.description ?? ""}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate">{photo.description}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.description ?? ""}
              className="w-full rounded-lg max-h-[75vh] object-contain"
            />
            <div className="mt-3 text-center space-y-1">
              {lightbox.description && (
                <p className="text-white text-sm">{lightbox.description}</p>
              )}
              <p className="text-gray-400 text-xs">
                {format(new Date(lightbox.log_date), "d MMMM yyyy · HH:mm", { locale: id })}
              </p>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
