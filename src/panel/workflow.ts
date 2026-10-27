import type { Stage } from "../model.js";

export const stages: { id: Stage; label: string; action: string }[] = [
  { id: "planning", label: "Проработка", action: "propose" },
  { id: "ready", label: "К реализации", action: "apply" },
  { id: "progress", label: "В работе", action: "continue" },
  { id: "complete", label: "Завершено", action: "archive" },
];

export const workflowLabel = (stage: Stage) =>
  ({ planning: "Подготовить", ready: "Реализовать", progress: "Продолжить", complete: "В архив" })[
    stage
  ];
export const stageLabel = (stage: Stage) => stages.find((item) => item.id === stage)!.label;
