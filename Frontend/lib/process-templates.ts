// lib/process-templates.ts

// Not: Projende zaten lib/types.ts içinde Methodology varsa onu import et.
// Yoksa aşağıdaki Methodology type'ını geçici kullanabilirsin.
import type { Methodology } from "@/lib/types"


export type TaskFieldId =
  | "storyPoints"
  | "dueDate"
  | "priority"
  | "severity"
  | "risk"
  | "labels"
  | "assignee"
  | "estimateHours"
  | "attachments";

export type TaskFieldDefinition = {
  id: TaskFieldId;
  label: string;
  defaultEnabled: boolean;
  description?: string;
};

export type ProcessTemplate = {
  id: Methodology;
  name: string;
  shortDescription: string;

  // Kanban board kolonları (UI'da göstereceğin/özelleştireceğin liste)
  columns: string[];

  // Task kartında gösterilecek alanlar (checkbox listesi)
  taskFields: TaskFieldDefinition[];

  // İstersen ileride dashboard builder için
  dashboardWidgets?: {
    id: string;
    title: string;
    defaultEnabled: boolean;
  }[];

  // İstersen ileride "doküman checklist" için
  artifacts?: {
    id: string;
    title: string;
    description?: string;
  }[];
};

export const processTemplates: ProcessTemplate[] = [
  {
    id: "scrum",
    name: "Scrum",
    shortDescription:
      "Sprint bazlı ilerleme. Değişken gereksinimler ve iteratif teslim için uygun.",
    columns: ["Backlog", "Selected", "In Progress", "Review", "Done"],
    taskFields: [
      {
        id: "storyPoints",
        label: "Story Point",
        defaultEnabled: true,
        description: "Sprint planlama ve kapasite takibi için.",
      },
      { id: "assignee", label: "Assignee", defaultEnabled: true },
      { id: "priority", label: "Priority", defaultEnabled: true },
      { id: "dueDate", label: "Due Date", defaultEnabled: true },
      { id: "labels", label: "Labels", defaultEnabled: true },
      {
        id: "estimateHours",
        label: "Estimate (hours)",
        defaultEnabled: false,
      },
      { id: "severity", label: "Severity", defaultEnabled: false },
      { id: "risk", label: "Risk", defaultEnabled: false },
      { id: "attachments", label: "Attachments", defaultEnabled: false },
    ],
    dashboardWidgets: [
      { id: "burndown", title: "Burndown", defaultEnabled: true },
      { id: "velocity", title: "Velocity", defaultEnabled: true },
      { id: "activity", title: "Activity Feed", defaultEnabled: true },
      { id: "risks", title: "Risk List", defaultEnabled: false },
    ],
    artifacts: [
      { id: "product-backlog", title: "Product Backlog" },
      { id: "sprint-backlog", title: "Sprint Backlog" },
      { id: "increment", title: "Increment" },
    ],
  },

  {
    id: "kanban",
    name: "Kanban",
    shortDescription:
      "Akış odaklı ilerleme. Sık değişen öncelikler ve kesintili işler için iyi.",
    columns: ["To Do", "In Progress", "Blocked", "Done"],
    taskFields: [
      { id: "assignee", label: "Assignee", defaultEnabled: true },
      { id: "priority", label: "Priority", defaultEnabled: true },
      { id: "dueDate", label: "Due Date", defaultEnabled: true },
      { id: "labels", label: "Labels", defaultEnabled: true },
      { id: "severity", label: "Severity", defaultEnabled: true },
      { id: "risk", label: "Risk", defaultEnabled: false },
      { id: "storyPoints", label: "Story Point", defaultEnabled: false },
      { id: "estimateHours", label: "Estimate (hours)", defaultEnabled: false },
      { id: "attachments", label: "Attachments", defaultEnabled: false },
    ],
    dashboardWidgets: [
      { id: "cfd", title: "Cumulative Flow", defaultEnabled: true },
      { id: "leadtime", title: "Lead Time", defaultEnabled: true },
      { id: "activity", title: "Activity Feed", defaultEnabled: true },
      { id: "risks", title: "Risk List", defaultEnabled: false },
    ],
    artifacts: [{ id: "wip-policy", title: "WIP Policies" }],
  },

  {
    id: "waterfall",
    name: "Waterfall",
    shortDescription:
      "Aşama aşama ilerleme. Gereksinimler sabitse ve dokümantasyon önemliyse uygun.",
    columns: ["Requirements", "Design", "Implementation", "Testing", "Release"],
    taskFields: [
      { id: "assignee", label: "Assignee", defaultEnabled: true },
      { id: "dueDate", label: "Due Date", defaultEnabled: true },
      { id: "priority", label: "Priority", defaultEnabled: true },
      { id: "severity", label: "Severity", defaultEnabled: true },
      { id: "risk", label: "Risk", defaultEnabled: true },
      { id: "labels", label: "Labels", defaultEnabled: false },
      { id: "estimateHours", label: "Estimate (hours)", defaultEnabled: true },
      { id: "storyPoints", label: "Story Point", defaultEnabled: false },
      { id: "attachments", label: "Attachments", defaultEnabled: true },
    ],
    dashboardWidgets: [
      { id: "gantt", title: "Gantt", defaultEnabled: true },
      { id: "milestones", title: "Milestones", defaultEnabled: true },
      { id: "risks", title: "Risk List", defaultEnabled: true },
      { id: "activity", title: "Activity Feed", defaultEnabled: false },
    ],
    artifacts: [
      { id: "srs", title: "SRS (Requirements)" },
      { id: "sdd", title: "SDD (Design)" },
      { id: "std", title: "STD (Test)" },
      { id: "release-notes", title: "Release Notes" },
    ],
  },
];

// Yardımcı fonksiyonlar (UI tarafında işine yarar)
export function getTemplateById(id: Methodology): ProcessTemplate {
  const t = processTemplates.find((x) => x.id === id);
  return t ?? processTemplates[0];
}

export function buildDefaultEnabledFieldsMap(template: ProcessTemplate) {
  return template.taskFields.reduce<Record<string, boolean>>((acc, f) => {
    acc[f.id] = f.defaultEnabled;
    return acc;
  }, {});
}
