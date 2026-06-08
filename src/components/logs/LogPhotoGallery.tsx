"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { getSignedPhotoUrl, deleteLogPhoto } from "@/services/batches";
import type { LogPhoto } from "@/types";

interface ResolvedPhoto extends LogPhoto {
  url: string;
}

interface LogPhotoGalleryProps {
  photos: LogPhoto[];
  canDelete?: boolean;
  onDeleted?: () => void;
}

export function LogPhotoGallery({ photos, canDelete, onDeleted }: LogPhotoGalleryProps) {
  const [resolved, setResolved] = useState<ResolvedPhoto[]>([]);
  const [lightbox, setLightbox] = useState<ResolvedPhoto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!photos.length) return;
    Promise.all(
      photos.map(async (p) => ({
        ...p,
        url: await getSignedPhotoUrl(p.storage_path),
      }))
    ).then(setResolved);
  }, [photos]);

  async function handleDelete(photo: ResolvedPhoto) {
    setDeleting(photo.id);
    try {
      await deleteLogPhoto(photo.id, photo.storage_path);
      setResolved((prev) => prev.filter((p) => p.id !== photo.id));
      if (lightbox?.id === photo.id) setLightbox(null);
      onDeleted?.();
    } finally {
      setDeleting(null);
    }
  }

  if (!resolved.length && !photos.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {resolved.map((photo) => (
          <div key={photo.id} className="relative group">
            <button
              type="button"
              onClick={() => setLightbox(photo)}
              className="block w-16 h-16 rounded-md overflow-hidden border border-gray-200 hover:border-green-400 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.description ?? ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={deleting === photo.id}
                onClick={() => handleDelete(photo)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 hidden group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Skeleton while resolving */}
        {!resolved.length && photos.map((p) => (
          <div key={p.id} className="w-16 h-16 rounded-md bg-gray-200 animate-pulse" />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
            {lightbox.description && (
              <p className="text-white text-sm text-center mt-3">{lightbox.description}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
