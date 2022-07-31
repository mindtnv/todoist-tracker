export type TaskServiceEvent =
  | "delete"
  | "done"
  | "create"
  | "update"
  | "shift";

export interface TodoService {
  on(
    event: TaskServiceEvent,
    callback: (task: CommonTask, ...args: any[]) => any
  ): void;

  start(): Promise<any>;
  stop(): Promise<any>;
}

export interface TaskMeta {
  labels: string[];
}

export interface CommonDue {
  date: Date;
}

export interface CommonTask {
  id: number;
  title: string;
  recurring: boolean;
  due?: CommonDue;
  labels: string[];
  order: number;
  priority: number;
}
