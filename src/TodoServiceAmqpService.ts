import { TaskServiceEvent, TodoService } from "./types";
import { Channel } from "amqplib";

export interface MessageSenderOptions {
  channel: Channel;
  exchange: string;
}

export class TodoServiceAmqpService {
  private readonly services: TodoService[];
  private readonly options: MessageSenderOptions;

  constructor(options: MessageSenderOptions, ...services: TodoService[]) {
    this.options = options;
    this.services = services;
  }

  async start() {
    this.services.forEach((service) => {
      ["create", "delete", "done", "update", "shift"].forEach((method) => {
        service.on(method as TaskServiceEvent, async (task) => {
          const content = Buffer.from(JSON.stringify(task), "utf-8");
          const labels = [...task.labels];
          if (labels.length === 0) labels.push("null");

          for (let label of labels) {
            const route = `${method}.${label}`;
            console.log(`[${route}] (${task.id}) ${task.title}`);
            this.options.channel.publish(this.options.exchange, route, content);
          }
        });
      });
    });
    for (let service of this.services) {
      await service.start();
    }
  }

  async stop() {
    for (let service of this.services) {
      await service.stop();
    }
  }
}
