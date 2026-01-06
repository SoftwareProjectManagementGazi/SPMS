// components/project/field-toggles.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export type FieldItem = {
  id: string;
  label: string;
  description?: string;
};

type Props = {
  fields: FieldItem[];
  enabled: Record<string, boolean>;
  onChange: (nextEnabled: Record<string, boolean>) => void;

  title?: string;
  description?: string;
};

export default function FieldToggles({
  fields,
  enabled,
  onChange,
  title = "Task Fields",
  description = "Choose which fields are visible on task cards.",
}: Props) {
  function setField(id: string, value: boolean) {
    onChange({
      ...enabled,
      [id]: value,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.map((f) => {
          const checked = Boolean(enabled[f.id]);
          return (
            <div
              key={f.id}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">{f.label}</div>
                {f.description ? (
                  <div className="text-xs text-muted-foreground">
                    {f.description}
                  </div>
                ) : null}
              </div>

              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setField(f.id, Boolean(v))}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
