import { TaskServiceEvent, TodoistTaskService } from "./TodoistTaskService";
import { Task, TodoistApi } from "@doist/todoist-api-typescript";
import Mock = jest.Mock;

jest.mock("@doist/todoist-api-typescript");

let service: TodoistTaskService;
let api: TodoistApi;

const SHIFT_PREFIX = "shift";

beforeEach(() => {
  api = new TodoistApi("");
  service = new TodoistTaskService(api, {
    shiftPrefix: SHIFT_PREFIX,
    pullInterval: 1,
  });
});

const mockGetTasks = (fabric: () => Partial<Task>[]) => {
  (api.getTasks as Mock).mockImplementation(() => Promise.resolve(fabric()));
};
const mockGetTask = (fabric: () => Partial<Task>) => {
  (api.getTask as Mock).mockImplementation(() => Promise.resolve(fabric()));
};

describe("Receive Test", () => {
  let events = new Map<string, number>();
  beforeEach(() => {
    events.clear();
    ["create", "delete", "done", "update", "shift"].forEach((e) => {
      service.on(e as TaskServiceEvent, () => {
        if (!events.has(e)) {
          events.set(e, 1);
        } else {
          events.set(e, events.get(e)! + 1);
        }
      });
    });
  });

  const haveBeenEmitted = (e: string) => {
    expect(events.has(e)).toBeTruthy();
    expect(events.get(e)).toBe(1);
  };

  test("Create -> Done", async () => {
    const task = { id: 1, content: "test", completed: false };
    mockGetTasks(() => [task]);
    await service.receive();
    mockGetTask(() => ({ ...task, completed: true }));
    mockGetTasks(() => []);
    await service.receive();
    haveBeenEmitted("create");
    haveBeenEmitted("done");
    expect(Array.from(events.keys())).toHaveLength(2);
  });

  test("Create -> Done Recurring", async () => {
    const task: Partial<Task> = {
      id: 1,
      content: "test",
      completed: false,
      due: {
        recurring: true,
        datetime: new Date().toISOString(),
        string: "",
        date: "",
        timezone: "",
      },
    };
    const nextTask = {
      ...task,
      due: {
        ...task.due,
        datetime: new Date(Date.now() + 10000).toISOString(),
      },
    } as Task;
    mockGetTasks(() => [task]);
    await service.receive();
    mockGetTasks(() => [nextTask]);
    await service.receive();
    haveBeenEmitted("create");
    haveBeenEmitted("done");
    expect(Array.from(events.keys())).toHaveLength(2);
  });

  test("Create -> Delete", async () => {
    const task = { id: 1, content: "test", completed: false };
    mockGetTasks(() => [task]);
    await service.receive();
    mockGetTask(() => {
      throw new Error("Task not found");
    });
    mockGetTasks(() => []);
    await service.receive();
    haveBeenEmitted("create");
    haveBeenEmitted("delete");
    expect(Array.from(events.keys())).toHaveLength(2);
  });

  test("Create -> Update", async () => {
    const task = { id: 1, content: "test", completed: false };
    const updatedTask = { ...task, content: "updated" };
    mockGetTasks(() => [task]);
    await service.receive();
    mockGetTasks(() => [updatedTask]);
    await service.receive();
    haveBeenEmitted("create");
    haveBeenEmitted("update");
    expect(Array.from(events.keys())).toHaveLength(2);
  });

  test("Create -> Shift", async () => {
    const task = { id: 1, content: "test", completed: false };
    const updatedTask = {
      ...task,
      description: `${SHIFT_PREFIX} some description`,
    };
    mockGetTasks(() => [task]);
    await service.receive();
    mockGetTasks(() => [updatedTask]);
    await service.receive();
    haveBeenEmitted("create");
    haveBeenEmitted("shift");
    expect(Array.from(events.keys())).toHaveLength(2);
  });
});
