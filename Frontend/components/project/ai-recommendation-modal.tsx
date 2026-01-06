// components/project/ai-recommendation-modal.tsx

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Methodology = "scrum" | "kanban" | "waterfall";

type Answers = {
  requirementsChange: "low" | "medium" | "high";
  regulation: "no" | "yes";
  teamSize: "1-3" | "4-8" | "9+";
  deadlineStrict: "no" | "yes";
  interrupts: "low" | "high";
  deliverInSprints: "no" | "yes";
};

type Result = {
  recommended: Methodology;
  alternative?: Methodology;
  reason: string;
};

function recommend(a: Answers): Result {
  // Basit kural tabanlı karar (frontend demo)
  // 1) regülasyon/dokümantasyon + sıkı deadline => waterfall
  if (a.regulation === "yes" && a.deadlineStrict === "yes") {
    return {
      recommended: "waterfall",
      alternative: a.requirementsChange === "high" ? "scrum" : "kanban",
      reason:
        "Regülasyon/dokümantasyon ihtiyacı ve sıkı teslim tarihleri aşama aşama planlamayı avantajlı yapar.",
    };
  }

  // 2) Çok kesinti/acil iş => kanban
  if (a.interrupts === "high") {
    return {
      recommended: "kanban",
      alternative: a.deliverInSprints === "yes" ? "scrum" : "waterfall",
      reason:
        "Sık acil iş ve değişen öncelikler olduğunda akış odaklı Kanban daha stabil ilerler.",
    };
  }

  // 3) Gereksinimler değişken + sprint isteği => scrum
  if (a.requirementsChange === "high" || a.deliverInSprints === "yes") {
    return {
      recommended: "scrum",
      alternative: "kanban",
      reason:
        "Değişken gereksinimler ve iteratif teslim için sprint bazlı Scrum daha uygundur.",
    };
  }

  // 4) Default
  return {
    recommended: "scrum",
    alternative: "waterfall",
    reason:
      "Takım içi planlama ve düzenli teslim için Scrum iyi bir başlangıç yaklaşımıdır.",
  };
}

export default function AiRecommendationModal({
  onApply,
}: {
  onApply: (methodology: Methodology) => void;
}) {
  const [open, setOpen] = useState(false);

  const [answers, setAnswers] = useState<Answers>({
    requirementsChange: "medium",
    regulation: "no",
    teamSize: "1-3",
    deadlineStrict: "no",
    interrupts: "low",
    deliverInSprints: "yes",
  });

  const result = useMemo(() => recommend(answers), [answers]);

  function apply() {
    onApply(result.recommended);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" type="button">
          AI ile süreç öner
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Süreç modeli önerisi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sorular */}
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Gereksinimler ne kadar değişiyor?</Label>
              <Select
                value={answers.requirementsChange}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    requirementsChange: v as Answers["requirementsChange"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Regülasyon / zorunlu dokümantasyon var mı?</Label>
              <Select
                value={answers.regulation}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    regulation: v as Answers["regulation"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Hayır</SelectItem>
                  <SelectItem value="yes">Evet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Takım büyüklüğü</Label>
              <Select
                value={answers.teamSize}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    teamSize: v as Answers["teamSize"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3</SelectItem>
                  <SelectItem value="4-8">4-8</SelectItem>
                  <SelectItem value="9+">9+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Deadline çok sıkı mı?</Label>
              <Select
                value={answers.deadlineStrict}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    deadlineStrict: v as Answers["deadlineStrict"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Hayır</SelectItem>
                  <SelectItem value="yes">Evet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Acil iş / kesinti çok geliyor mu?</Label>
              <Select
                value={answers.interrupts}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    interrupts: v as Answers["interrupts"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Az</SelectItem>
                  <SelectItem value="high">Çok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Sprint’lerle teslim yapmak istiyor musun?</Label>
              <Select
                value={answers.deliverInSprints}
                onValueChange={(v) =>
                  setAnswers((p) => ({
                    ...p,
                    deliverInSprints: v as Answers["deliverInSprints"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Evet</SelectItem>
                  <SelectItem value="no">Hayır</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sonuç */}
          <Card className="p-4 space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Önerilen:</span>{" "}
              {result.recommended.toUpperCase()}
            </div>
            {result.alternative ? (
              <div className="text-sm text-muted-foreground">
                Alternatif: {result.alternative.toUpperCase()}
              </div>
            ) : null}
            <div className="text-sm">{result.reason}</div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Kapat
            </Button>
            <Button onClick={apply}>Öneriyi uygula</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
