import type { Stage } from "../model.js";
import { t } from "./i18n.js";
export const stages: { id: Stage; label: string; action: string }[] = [
  { id: "planning", label: "Planning", action: "propose" },
  { id: "ready", label: "Ready", action: "apply" },
  { id: "progress", label: "In Progress", action: "continue" },
  { id: "complete", label: "Complete", action: "archive" },
];
export const workflowLabel = (stage: Stage) => t(stages.find((s) => s.id === stage)!.action);
export const stageLabel = (stage: Stage) => t(stages.find((s) => s.id === stage)!.label);
