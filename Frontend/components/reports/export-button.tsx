"use client"

import { useState } from "react"
import { Download, ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { reportService, ReportFilters } from "@/services/report-service"

interface ExportButtonProps {
  filters: ReportFilters;
  disabled?: boolean;
  projectKey?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ExportButton({ filters, disabled, projectKey = "REPORT" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const dateStr = new Date().toISOString().split("T")[0];

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await reportService.exportPdf(filters);
      const filename = `SPMS_Report_${projectKey}_${dateStr}.pdf`;
      downloadBlob(blob, filename);
      toast.success("Rapor indirildi.");
    } catch {
      toast.error("Rapor oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await reportService.exportExcel(filters);
      const filename = `SPMS_Report_${projectKey}_${dateStr}.xlsx`;
      downloadBlob(blob, filename);
      toast.success("Rapor indirildi.");
    } catch {
      toast.error("Rapor oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          disabled={disabled || isExporting}
          className="min-w-[120px]"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              İndiriliyor...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
              <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
          PDF olarak indir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
          Excel olarak indir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
