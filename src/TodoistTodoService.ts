import { TaskServiceEvent, TodoistTaskService } from "./TodoistTaskService";
import { TodoistLabelService } from "./TodoistLabelService";
import { Label, TodoistApi } from "@doist/todoist-api-typescript";
import { CommonTask } from "./types";
import { todoistTaskConverter } from "./TodoistTaskConverter";

export type TodoServiceEvent = TaskServiceEvent;

export class TodoistTodoService {
  private readonly api: TodoistApi;
  tasks: TodoistTaskService;
  labels: TodoistLabelService;

  constructor(private readonly apiToken: string) {
    this.api = new TodoistApi(apiToken);
    this.tasks = new TodoistTaskService(this.api, {
      pullInterval: 1500,
      shiftPrefix: "!",
    });
    this.labels = new TodoistLabelService(this.api);
  }

  on(
    event: TodoServiceEvent,
    callback: (task: CommonTask, ...args: any[]) => any
  ) {
    this.tasks.on(event, async (task) => {
      const labels: Label[] = [];
      for (let labelId of task.labelIds) {
        labels.push(await this.labels.resolve(labelId));
      }
      const commonTask = todoistTaskConverter(task, {
        labels: labels.map((x) => x.name),
      });
      callback(commonTask);
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
