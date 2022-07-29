import { TodoistLabelService } from "./TodoistLabelService";
import { Label, TodoistApi } from "@doist/todoist-api-typescript";

jest.mock("@doist/todoist-api-typescript");

let api: TodoistApi;
let service: TodoistLabelService;

beforeEach(() => {
  api = new TodoistApi("");
  service = new TodoistLabelService(api);
  (api.getLabel as jest.Mock<Promise<Label>, number[]>).mockImplementation(
    (x) =>
      Promise.resolve({
        id: x,
        name: x.toString(),
        order: 0,
        favorite: false,
        color: 0,
      })
  );
});

describe("Resolve tests", () => {
  test("Api request", async () => {
    await service.resolve(1);
    expect(api.getLabel).toHaveBeenCalled();
  });
  test("Response cashed after api request", async () => {
    await service.resolve(1);
    await service.resolve(1);
    expect(api.getLabel).toHaveBeenCalledTimes(1);
  });
});
