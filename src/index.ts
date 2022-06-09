import { TodoService } from "./TodoService";
import { getEnvOrThrow } from "./utils";
import { TaskServiceEvent } from "./TaskService";

const amqp = require("amqplib");
const EXCHANGE = process.env["APP_AMQP_EXCHANGE"] ?? "todolist";
const AMQP_URL = getEnvOrThrow("APP_AMQP_URL");
const API_TOKEN = getEnvOrThrow("APP_TODOIST_TOKEN");

const main = async () => {
  console.log(`Connecting to AMQP server ${AMQP_URL}`);
  const connection = await amqp.connect(AMQP_URL);
  const channel = await connection.createChannel();
  console.log(`Asserting ${EXCHANGE} exchange`);
  await channel.assertExchange(EXCHANGE, "topic");
  const service = new TodoService(API_TOKEN);

  ["create", "delete", "done", "update"].forEach((method) => {
    service.on(method as TaskServiceEvent, async (task) => {
      const content = Buffer.from(JSON.stringify(task), "utf-8");
      for (let label of task.labels) {
        const route = `${method}.${label.name}`;
        console.log(`[${route}] (${task.id}) ${task.content}`);
        channel.publish(EXCHANGE, route, content);
      }
    });
  });

  console.log(`Start pulling updates`);
  await service.start();
};

main();
