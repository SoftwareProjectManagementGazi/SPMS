"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MemberPerformance } from "@/services/report-service"

interface TeamPerformanceTableProps {
  data: MemberPerformance[];
  isLoading: boolean;
  isError: boolean;
  limit?: number;             // Limit rows shown (e.g., 5 for dashboard)
  onRowClick?: (userId: number) => void;  // Click handler for filter integration
  emptyMessage?: string;
}

type SortField = "assigned" | "completed" | "in_progress" | "on_time_pct";
type SortDir = "asc" | "desc";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getOnTimePctColor(pct: number): string {
  if (pct >= 80) return "hsl(var(--chart-2))";
  if (pct >= 50) return "hsl(var(--chart-3))";
  return "hsl(var(--destructive))";
}

export function TeamPerformanceTable(props: TeamPerformanceTableProps) {
  const { data, isLoading, isError, limit, onRowClick, emptyMessage } = props;
  const [sortField, setSortField] = useState<SortField>("completed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleHeaderClick(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    if (limit != null) return sorted.slice(0, limit);
    return sorted;
  }, [data, sortField, sortDir, limit]);

  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive text-center py-4">
        Veriler yüklenemedi. Sayfayı yenileyin.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {emptyMessage ?? "Bu proje için henüz performans verisi yok."}
      </p>
    );
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-4 w-4 text-primary inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary inline ml-1" />
    );
  }

  function SortableHead({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) {
    return (
      <TableHead
        className="cursor-pointer select-none min-h-[44px]"
        onClick={() => handleHeaderClick(field)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon field={field} />
        </span>
      </TableHead>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Ad</TableHead>
          <SortableHead field="assigned" label="Atanan" />
          <SortableHead field="completed" label="Tamamlanan" />
          <SortableHead field="on_time_pct" label="Zamanında %" />
          <SortableHead field="in_progress" label="Devam Eden" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((member) => {
          const avatarSrc = member.avatar_path
            ? `/api/v1/auth/avatar/${member.avatar_path.split("/").pop()}`
            : "/placeholder.svg";
          const barColor = getOnTimePctColor(member.on_time_pct);

          return (
            <TableRow
              key={member.user_id}
              className="cursor-pointer hover:bg-muted/50 min-h-[44px]"
              style={{ height: "44px" }}
              onClick={() => onRowClick?.(member.user_id)}
            >
              <TableCell>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <span className="font-medium">{member.full_name}</span>
              </TableCell>
              <TableCell>{member.assigned}</TableCell>
              <TableCell>{member.completed}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${member.on_time_pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right">
                    {member.on_time_pct}%
                  </span>
                </div>
              </TableCell>
              <TableCell>{member.in_progress}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
