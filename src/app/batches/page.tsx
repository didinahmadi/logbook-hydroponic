"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBatches } from "@/hooks/useBatches";
import { deleteBatch } from "@/services/batches";

export default function BatchesPage() {
  const { batches, loading, refetch } = useBatches();

  async function handleDelete(id: string) {
    try {
      await deleteBatch(id);
      toast.success("Batch dihapus");
      refetch();
    } catch (err) {
      toast.error("Gagal menghapus batch");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Tanam</h1>
            <p className="text-sm text-gray-500 mt-1">Semua batch tanam Anda</p>
          </div>
          <Link href="/batches/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" /> Buat Batch
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">Belum ada batch</p>
            <Link href="/batches/new" className="mt-4 inline-block">
              <Button className="bg-green-600 hover:bg-green-700 mt-3">
                <Plus className="h-4 w-4 mr-1" /> Buat Batch Pertama
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tanaman</TableHead>
                  <TableHead className="hidden sm:table-cell">Tgl Semai</TableHead>
                  <TableHead className="hidden md:table-cell">Lubang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      <Link href={`/batches/${batch.id}`} className="hover:text-green-700 hover:underline">
                        {batch.name}
                      </Link>
                    </TableCell>
                    <TableCell>{batch.plant.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-500">
                      {format(parseISO(batch.seed_date), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500">
                      {batch.hole_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={batch.status === "active" ? "default" : "secondary"}
                        className={batch.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {batch.status === "active" ? "Aktif" : "Panen"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/batches/${batch.id}`}>
                          <Button variant="ghost" size="sm" className="text-green-700">
                            Detail
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus batch?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Batch <strong>{batch.name}</strong> dan semua log terkait akan dihapus. Tindakan ini tidak bisa dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(batch.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
