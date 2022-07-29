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
