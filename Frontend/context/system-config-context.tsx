"use client"
import React, { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminSettingsService } from "@/services/admin-settings-service"

interface SystemConfigContextType {
  config: Record<string, string>;
  isLoading: boolean;
  refetch: () => void;
}

const SystemConfigContext = createContext<SystemConfigContextType>({
  config: {},
  isLoading: true,
  refetch: () => {},
});

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["system-config"],
    queryFn: adminSettingsService.get,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });

  const config = data?.config ?? {};

  // Inject primary brand color as CSS custom property dynamically (ADAPT-03, D-14)
  React.useEffect(() => {
    const brandColor = config.primary_brand_color;
    if (brandColor && brandColor.length > 0) {
      document.documentElement.style.setProperty("--primary", brandColor);
    } else {
      document.documentElement.style.removeProperty("--primary");
    }
  }, [config.primary_brand_color]);

  return (
    <SystemConfigContext.Provider value={{ config, isLoading, refetch }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  return useContext(SystemConfigContext);
}
