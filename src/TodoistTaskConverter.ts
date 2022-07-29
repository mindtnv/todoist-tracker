import { Task } from "@doist/todoist-api-typescript";
import { CommonTask, TaskMeta } from "./types";

export const todoistTaskConverter = (
  task: Task,
  meta: TaskMeta
): CommonTask => {
  const result: CommonTask = {
    id: task.id,
    title: task.content,
    labels: meta.labels,
    order: task.order,
    priority: task.priority,
    recurring: false,
    due: undefined,
  };

  if (task.due) {
    result.recurring = task.due.recurring;
    result.due = {
      date: new Date(task.due.datetime ?? task.due.date),
    };
  }

  return result;
};
