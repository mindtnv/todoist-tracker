import { GetTasksArgs, Task, TodoistApi } from "@doist/todoist-api-typescript";
import { clearInterval } from "timers";
import EventEmitter from "events";

export type TaskServiceEvent = "delete" | "done" | "create";

export interface TaskServiceOptions {
  pullInterval: number;
  filter?: GetTasksArgs;
}

export class TaskService {
  private readonly api: TodoistApi;
  private readonly emitter = new EventEmitter();
  private interval: NodeJS.Timer | null = null;

  constructor(
    apiOrToken: TodoistApi | string,
    readonly options: TaskServiceOptions
  ) {
    if (typeof apiOrToken === "string") this.api = new TodoistApi(apiOrToken);
    else this.api = apiOrToken;
  }

  on(event: TaskServiceEvent, callback: (task: Task, ...args: any[]) => void) {
    this.emitter.on(event, callback);
  }

  start() {
    const store = new Map<number, Task>();
    this.interval = setInterval(async () => {
      const responseTaskIds = new Set<number>();
      const tasks = await this.api.getTasks(this.options.filter);

      tasks.forEach((task) => {
        if (!store.has(task.id)) {
          store.set(task.id, task);
          this.emitter.emit("create", task);
        }
        responseTaskIds.add(task.id);
      });

      for (let task of store.values()) {
        if (!responseTaskIds.has(task.id)) {
          store.delete(task.id);
          try {
            const t = await this.api.getTask(task.id);
            if (t.completed) this.emitter.emit("done", t);
          } catch (e) {
            this.emitter.emit("delete", task);
          }
        }
      }
    }, this.options.pullInterval);
  }

  stop() {
    if (this.interval !== null) clearInterval(this.interval);

    this.emitter.removeAllListeners();
  }
}
