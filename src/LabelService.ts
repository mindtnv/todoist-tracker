import { Label, TodoistApi } from "@doist/todoist-api-typescript";

export class LabelService {
  private readonly api: TodoistApi;
  private store = new Map<number, Label>();

  constructor(apiOrToken: TodoistApi | string) {
    if (typeof apiOrToken === "string") this.api = new TodoistApi(apiOrToken);
    else this.api = apiOrToken;
  }

  async pull() {
    const labels = await this.api.getLabels();
    labels.forEach((label) => {
      this.store.set(label.id, label);
    });
  }

  async resolve(id: number): Promise<Label> {
    if (!this.store.has(id)) {
      this.store.set(id, await this.api.getLabel(id));
    }

    return this.store.get(id)!;
  }
}
