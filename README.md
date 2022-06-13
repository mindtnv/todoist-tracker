# todoist-tracker

Crawls updates from **todoist api** and send to **RabbitMQ** message queue.

## Environment variables

- **APP_AMQP_URL** - RabbitMQ server url
- **APP_AMQP_EXCHANGE** - exchange name. _todolist_ by default.
- **APP_TODOIST_TOKEN** - todoist api token

## Routing Key

Message sends with **{method}.{tag}** routing key.

## Task object
