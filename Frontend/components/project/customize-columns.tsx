// components/project/customize-columns.tsx

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  columns: string[];
  onChange: (next: string[]) => void;

  title?: string;
  description?: string;
};

export default function CustomizeColumns({
  columns,
  onChange,
  title = "Customize Workflow Columns",
  description = "Add, rename, or remove columns for this project.",
}: Props) {
  const [newColumn, setNewColumn] = useState("");

  const normalized = useMemo(() => columns.map((c) => c.trim()), [columns]);

  function renameColumn(index: number, value: string) {
    const next = [...normalized];
    next[index] = value;
    onChange(next);
  }

  function removeColumn(index: number) {
    const next = normalized.filter((_, i) => i !== index);
    onChange(next.length ? next : ["To Do"]); // tamamen boş kalmasın
  }

  function addColumn() {
    const name = newColumn.trim();
    if (!name) return;

    // aynı isim varsa ekleme
    const exists = normalized.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    if (exists) return;

    onChange([...normalized, name]);
    setNewColumn("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* mevcut kolonlar */}
        <div className="space-y-2">
          {normalized.map((col, idx) => (
            <div key={`${col}-${idx}`} className="flex gap-2 items-center">
              <Input
                value={col}
                onChange={(e) => renameColumn(idx, e.target.value)}
                placeholder="Column name"
              />
              <Button
                variant="secondary"
                onClick={() => removeColumn(idx)}
                type="button"
              >
                Sil
              </Button>
            </div>
          ))}
        </div>

        {/* yeni kolon ekleme */}
        <div className="flex gap-2 items-center">
          <Input
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            placeholder="Yeni kolon adı"
            onKeyDown={(e) => {
              if (e.key === "Enter") addColumn();
            }}
          />
          <Button onClick={addColumn} type="button">
            Kolon ekle
          </Button>
        </div>

        {/* <p className="text-xs text-muted-foreground">
          Not: Drag & drop eklemek istersen sonra @dnd-kit ile kolayca
          geliştirebiliriz.
        </p> */}
      </CardContent>
    </Card>
  );
}
