"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { GROWING_METHOD_LABELS } from "@/utils/labels";

export function TodaysTasks() {
  const { tasks, loading } = useTodaysTasks();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Tugas Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Tugas Hari Ini
          {tasks.length > 0 && (
            <span className="ml-auto text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {tasks.length} belum dicatat
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex items-center gap-2.5 text-green-700 py-1">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Semua batch sudah dicatat hari ini</span>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link
                key={task.batchId}
                href={`/batches/${task.batchId}`}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{task.batchName}</p>
                    <p className="text-xs text-gray-500">
                      {task.plantName} · {GROWING_METHOD_LABELS[task.growingMethod]}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-700 font-semibold group-hover:text-amber-900">
                  Catat →
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
