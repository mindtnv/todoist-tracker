import { GetTasksArgs, Task, TodoistApi } from "@doist/todoist-api-typescript";
import { clearInterval } from "timers";
import EventEmitter from "events";
import { TaskServiceEvent } from "./types";

export interface TodoistTaskServiceOptions {
  pullInterval: number;
  filter?: GetTasksArgs;
  shiftPrefix: string;
}

export class TodoistTaskService {
  private readonly api: TodoistApi;
  private readonly emitter = new EventEmitter();
  private readonly store = new Map<number, Task>();
  private interval: NodeJS.Timer | null = null;

  constructor(
    apiOrToken: TodoistApi | string,
    readonly options: TodoistTaskServiceOptions
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

  private emitCreate(task: Task) {
    this.store.set(task.id, task);
    this.emitter.emit("create", task);
  }

  private emitShift(task: Task) {
    this.store.set(task.id, task);
    this.emitter.emit("shift", task);
  }

  private emitDone(task: Task) {
    this.store.set(task.id, task);
    this.emitter.emit("done", task);
  }

  private emitUpdate(task: Task) {
    this.store.set(task.id, task);
    this.emitter.emit("update", task);
  }

  private emitDelete(task: Task) {
    this.emitter.emit("delete", task);
  }

  async receive() {
    const responseTaskIds = new Set<number>();
    const currentTasks = await this.api.getTasks(this.options.filter);
    for (let task of currentTasks) {
      responseTaskIds.add(task.id);
      // New task added
      if (!this.store.has(task.id)) {
        this.emitCreate(task);
        continue;
      }
      // Task can be changed
      const savedTask = this.store.get(task.id) as Task;
      if (JSON.stringify(task) !== JSON.stringify(savedTask)) {
        // Shift recurring task
        if (
          task.description &&
          task.description.length &&
          task.description.startsWith(this.options.shiftPrefix)
        ) {
          this.emitShift(task);
          continue;
        }
        // Recurring task is done
        if (task?.due?.recurring && savedTask?.due?.recurring) {
          const savedDate = savedTask.due?.datetime ?? savedTask.due.date;
          const newDate = task.due?.datetime ?? task.due.date;
          if (newDate > savedDate) {
            this.emitDone(savedTask);
            continue;
          }
        }
        // Simple update
        this.emitUpdate(task);
      }
    }
    // Catch discarded tasks
    let tasksToDelete = [];
    for (let task of this.store.values()) {
      if (!responseTaskIds.has(task.id)) {
        tasksToDelete.push(task.id);
        try {
          const discardedTask = await this.api.getTask(task.id);
          if (discardedTask.completed) {
            this.emitDone(discardedTask);
          }
        } catch (e) {
          this.emitDelete(task);
        }
      }
    }
    tasksToDelete.forEach((x) => this.store.delete(x));
  }

  start() {
    this.interval = setInterval(async () => {
      try {
        await this.receive();
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
