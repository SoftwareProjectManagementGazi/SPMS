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
  title = "İş Akışı Sütunlarını Özelleştir",
  description = "Bu proje için sütun ekleyin, yeniden adlandırın veya kaldırın.",
}: Props) {
  const [newColumn, setNewColumn] = useState("");

  // Boşlukları temizle ama orijinal array yapısını bozma
  const normalized = useMemo(() => columns, [columns]);

  function renameColumn(index: number, value: string) {
    const next = [...normalized];
    next[index] = value;
    onChange(next);
  }

  function removeColumn(index: number) {
    const next = normalized.filter((_, i) => i !== index);
    onChange(next.length ? next : ["Yapılacaklar"]); // tamamen boş kalmasın
  }

  function addColumn() {
    const name = newColumn.trim();
    if (!name) return;

    // Aynı isim varsa ekleme (büyük/küçük harf duyarsız kontrol)
    const exists = normalized.some(
      (c) => c.trim().toLowerCase() === name.toLowerCase()
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
        {/* Mevcut kolonlar */}
        <div className="space-y-2">
          {normalized.map((col, idx) => (
            // DÜZELTME: key değeri `col` içermemeli, sadece index olmalı.
            // Böylece yazı yazarken component re-mount olmaz ve focus kaybolmaz.
            <div key={idx} className="flex gap-2 items-center">
              <Input
                value={col}
                onChange={(e) => renameColumn(idx, e.target.value)}
                placeholder="Sütun adı"
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

        {/* Yeni kolon ekleme */}
        <div className="flex gap-2 items-center">
          <Input
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            placeholder="Yeni kolon adı"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Form submitini engelle
                addColumn();
              }
            }}
          />
          <Button onClick={addColumn} type="button">
            Kolon Ekle
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {/* Not: İleride sürükle-bırak özelliği ile sıralamayı değiştirebileceksiniz. */}
        </p>
      </CardContent>
    </Card>
  );
}