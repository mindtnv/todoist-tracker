# todoist-tracker

Crawls updates from **todoist api** and send to **RabbitMQ** message queue.

## Environment variables

- **APP_AMQP_SERVER** - RabbitMQ server url
- **APP_AMQP_EXCHANGE** - exchange name. *todolist* by default.
- **APP_TODOIST_TOKEN** - todoist api token

## Routing Key

Message sends with **{method}.{tag}** routing key.

## Task object

