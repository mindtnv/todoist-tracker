import { CommonTask } from "./types";
import { todoistTaskConverter } from "./TodoistTaskConverter";
import { Task } from "@doist/todoist-api-typescript";

describe("Common logic", () => {
  test("Verbose task", () => {
    const task: any = {
      assignee: 2671362,
      commentCount: 10,
      completed: false,
      content: "Buy Milk",
      description: "",
      due: {
        date: "2016-09-01",
        recurring: false,
        datetime: "2016-09-01T09:00:00Z",
        string: "tomorrow at 12",
        timezone: "Europe/Moscow",
      },
      id: 2995104339,
      labelsId: [2156154810, 2156154820, 2156154826],
      order: 1,
      priority: 1,
      projectId: 2203306141,
      sectionId: 7025,
      parentId: 2995104589,
      url: "https://todoist.com/showTask?id=2995104339",
    };

    const commonTaskWithoutLabels: CommonTask = {
      order: 1,
      priority: 1,
      recurring: false,
      due: {
        date: new Date("2016-09-01T09:00:00Z"),
      },
      id: 2995104339,
      labels: [],
      title: "Buy Milk",
    };

    // Due copy
    const commonTaskWithLabels: CommonTask = {
      ...commonTaskWithoutLabels,
      labels: ["a", "b"],
    };

    expect(
      todoistTaskConverter(task as Task, {
        labels: [],
      })
    ).toEqual(commonTaskWithoutLabels);
    expect(
      todoistTaskConverter(task as Task, {
        labels: ["a", "b"],
      })
    ).toEqual(commonTaskWithLabels);
  });
});
