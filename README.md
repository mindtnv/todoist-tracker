# todoist-tracker

Crawls updates from **todoist api** and send to **RabbitMQ** message queue.

## Environment variables

- **APP_AMQP_URL** - RabbitMQ server url
- **APP_AMQP_EXCHANGE** - exchange name. _todolist_ by default.
- **APP_TODOIST_TOKEN** - todoist api token

## Routing Key

Message sends with **{method}.{tag}** routing key.

## Dev accounts

### Todoist

`testdev1929@gmail.com`:`dk8A10Hf`
`e008137d156508affa2e84931b22fdab922f7641`

## Task object

```ts
export interface CommonDue {
  date: Date;
}

export interface CommonTask {
  id: number;
  title: string;
  recurring: boolean;
  due?: CommonDue;
  labels: string[];
  order: number;
  priority: number;
}
```
