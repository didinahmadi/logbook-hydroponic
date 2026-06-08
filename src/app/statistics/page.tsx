"use client";

export const dynamic = "force-dynamic";

import { Activity, CheckCircle2, Scale } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useStatistics } from "@/hooks/useStatistics";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { stats, loading } = useStatistics();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistik</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas kebun hidroponik Anda</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={Activity}
              label="Batch Aktif"
              value={String(stats.totalActive)}
              color="bg-green-500"
            />
            <StatCard
              icon={CheckCircle2}
              label="Total Panen"
              value={String(stats.totalHarvested)}
              color="bg-blue-500"
            />
            <StatCard
              icon={Scale}
              label="Total Bobot Panen"
              value={`${stats.totalWeightKg.toFixed(2)} kg`}
              color="bg-orange-500"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
