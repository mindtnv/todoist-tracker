import { GetTasksArgs, Task, TodoistApi } from "@doist/todoist-api-typescript";
import { clearInterval } from "timers";
import EventEmitter from "events";

export type TaskServiceEvent = "delete" | "done" | "create" | "update";

export interface TaskServiceOptions {
  pullInterval: number;
  filter?: GetTasksArgs;
}

export class TaskService {
  private readonly api: TodoistApi;
  private readonly emitter = new EventEmitter();
  private readonly store = new Map<number, Task>();
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

  async pull() {
    const tasks = await this.api.getTasks(this.options.filter);
    tasks.forEach((task) => this.store.set(task.id, task));
  }

  start() {
    this.interval = setInterval(async () => {
      try {
        const responseTaskIds = new Set<number>();
        const currentTasks = await this.api.getTasks(this.options.filter);

        for (let task of currentTasks) {
          responseTaskIds.add(task.id);
          if (!this.store.has(task.id)) {
            this.store.set(task.id, task);
            this.emitter.emit("create", task);
          } else {
            // Task can be changed
            const savedTask = this.store.get(task.id) as Task;
            if (JSON.stringify(task) !== JSON.stringify(savedTask)) {
              if (task?.due?.recurring && savedTask?.due?.recurring) {
                const savedDate = savedTask.due?.datetime ?? savedTask.due.date;
                const newDate = task.due?.datetime ?? task.due.date;

                if (newDate > savedDate) {
                  this.store.set(task.id, task);
                  this.emitter.emit("done", savedTask);
                  continue;
                }
              }

              this.store.set(task.id, task);
              this.emitter.emit("update", task);
            }
          }
        }

        for (let task of this.store.values()) {
          if (!responseTaskIds.has(task.id)) {
            this.store.delete(task.id);
            try {
              const t = await this.api.getTask(task.id);
              if (t.completed) this.emitter.emit("done", t);
            } catch (e) {
              this.emitter.emit("delete", task);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, this.options.pullInterval);
  }

  stop() {
    if (this.interval !== null) clearInterval(this.interval);

    this.emitter.removeAllListeners();
  }
}
