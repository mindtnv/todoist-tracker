import { TaskService, TaskServiceEvent } from "./TaskService";
import { LabelService } from "./LabelService";
import { Label, Task, TodoistApi } from "@doist/todoist-api-typescript";

export type TodoServiceEvent = TaskServiceEvent;

export interface Todo extends Task {
  labels: Label[];
}

export class TodoService {
  private readonly api: TodoistApi;
  tasks: TaskService;
  labels: LabelService;

  constructor(private readonly apiToken: string) {
    this.api = new TodoistApi(apiToken);
    this.tasks = new TaskService(this.api, {
      pullInterval: 1000,
    });
    this.labels = new LabelService(this.api);
  }

  on(event: TodoServiceEvent, callback: (task: Todo, ...args: any[]) => any) {
    this.tasks.on(event, async (task) => {
      const labels: Label[] = [];
      for (let labelId of task.labelIds) {
        labels.push(await this.labels.resolve(labelId));
      }
      const todo = {
        ...task,
        labels,
      };
      callback(todo);
    });
  }

  async start() {
    await this.labels.pull();
    await this.tasks.pull();
    this.tasks.start();
  }

  stop() {
    this.tasks.stop();
  }
}
