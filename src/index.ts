import { TodoistTodoService } from "./TodoistTodoService";
import { getEnvOrThrow } from "./utils";
import { TodoServiceAmqpService } from "./TodoServiceAmqpService";

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

  const todoistService = new TodoistTodoService(API_TOKEN);
  const sender = new TodoServiceAmqpService(
    {
      channel,
      exchange: EXCHANGE,
    },
    todoistService
  );

  console.log(`Start pulling updates`);
  await sender.start();
};

main();
