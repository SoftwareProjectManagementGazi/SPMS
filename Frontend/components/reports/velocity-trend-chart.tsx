"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { VelocityData } from "@/services/report-service"

interface VelocityTrendChartProps {
  data: VelocityData | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function VelocityTrendChart({ data, isLoading, isError }: VelocityTrendChartProps) {
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-64" />;
    }

    if (isError) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Veriler yüklenemedi. Sayfayı yenileyin.</p>
        </div>
      );
    }

    if (!data || !data.series || data.series.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Bu dönem için veri bulunamadı.</p>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="completed_count"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Velocity Trendi
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
