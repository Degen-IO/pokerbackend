# HomeGame - Backend

## Project Description

This is an API for `HomeGame`, a Texas Hold Em poker platform built with the flexibility of a house game in mind. Users can create groups and host cash games or tournaments within their group. Group admins and accepted members may schedule games in advance and customize a number of game attributes like game speed, number of players per table, add-ons, etc.

## Setup

1. Run `npm i`
2. Create a `.env` file in the root of the backend folder. See [`Env Setup`](#env-setup) portion of this doc.
3. Follow steps for [self-hosted database](#self-hosted) or [container-based database](#container) to setup your dev database.

## Env Setup

To prepare the development environment, you need files containing sensitive information for accessing backend services. These files are intentionally excluded due to their confidential nature. Additionally, this approach permits us to define variables tailored to the local environment, ensuring uniqueness across each developer's machine.

1. Create .env file
2. Inside the newly created .env file, add the following fields and populate them per your machine. These fields will be used to connect to your local enviroment or containerized backend instances (also found in `.env.example`):

   ```
   # NODE_ENV = 'test' for jest, TO DO: Add 'prod' or 'dev' for other options
   NODE_ENV=prod

   # Postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=
   POSTGRES_DB=poker
   POSTGRES_HOST=db     # use 'db' to connect to container or use 'localhost' here for self-hosting
   POSTGRES_PORT=5432

   # PGAdmin (These will just be used for the container instance of pgadmin to interact with the containerized postgres instance)
   PGADMIN_DEFAULT_EMAIL=email@address.com
   PGADMIN_DEFAULT_PASSWORD=password

   #Redis
   REDIS_HOST=redis
   REDIS_PORT=6379

   ```

   #### NOTE: Be sure to remove any additional whitespace or trailing comments from your values, Podman seems to want to include these in the variable names while Docker does not seem to mind their existance. This can cause unintended errors on initialization, such as trying to connect to _'db #comment here'_ or _'db '_ instead of 'db'. [See troubleshooting](#incorrect-database-configuration-provided-in-env)

## Self Hosted

You may run this on your local machine.

- Make sure you have [postgres](https://www.postgresql.org/download/) and [pgadmin](https://www.pgadmin.org/download/) installed locally, as well as a local user setup for PGAdmin.
- Define the following variables from your local enviroment in `.env`:
  - `POSTGRES_HOST` => localhost (replace the default of db)
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- In your local instance of PGAdmin, you will need to follow steps 6-9 in the [container instructions](#run-the-app-using-docker-or-podman)
- Seed the database with `npm run seed`.
- Run the local API with `npm start` or `npm run watch`.

## Container

We employ Docker or Podman scripts to start several containers within your local environment, streamlining the development process and substituting certain system configurations with these containers.

### Run the app using Docker or Podman

---

1. Choose your container:

#### Docker:

- Install [Docker Engine](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) as standalone binaries
- Install [Docker Desktop](https://docs.docker.com/desktop/) which includes both Docker Engine and Docker Compose

#### Podman:

- Install [Podman Desktop](https://podman-desktop.io/)
- Install [Podman Compose](https://formulae.brew.sh/formula/podman-compose)

2. Create .env file as specified [here](#env-setup).
3. Run `npm run docker:up` or `npm run podman:up` to download, build, and start containers defined in docker-compose.yml. Note: terminating this command will stop the containers. Add -d to detach and run in background.
4. After this, your container manager of choice will be running the backend, database, and pgadmin.
5. Go to the `pgadmin` container and select the container action `Open in Browser`. Use the `#PGADMIN` credentials set from your `.env`. You will need to setup the database.
6. Click `Add New Server`. You will now be able to input your settings to create the database. In the General tab, choose whatever name you like.
7. In the Connection tab, input the following from your enviroment variables:
   - The Host Name / Address (default db) => `POSTGRES_HOST`
   - Username => `POSTGRES_USER`
   - Password => `POSTGRES_PASSWORD`
8. Open up Docker/Podman and go to the CLI for backend container actions.
9. Run `npm run seed` to seed the tables in the database and you've up and running!

### Docker Scripts

---

You have at your disposal the following set of `docker-compose` commands to manage these containers effectively.

#### `npm run docker:up`

This command initiates the building and starting of Docker containers. It serves as the primary step when no containers are currently active. It takes care of downloading or constructing all required container images and subsequently launching the essential containers and networks. If needed, you can run it in the background by adding the `-d` flag.

#### `npm run docker:down`

Stop and remove Docker containers. Please exercise caution, as it will erase all data within the database and pgadmin. Use it when you require a fresh start or exclusively for the `backend` service.

#### `npm run docker:start`

This command restarts containers that were previously stopped.

#### `npm run docker:stop`

It halts previously created Docker containers without removing them from your system.

#### `npm run docker:restart`

This command effectively restarts all Docker services, essentially performing the same operation as `npm run docker:stop && npm run docker:start`.

#### `npm run docker:logs`

Use this command to monitor and print logs generated by Docker services.

#### `npm run docker:rebuild`

This command recompiles the services, or a specific service if indicated. Consider using it alongside the `backend` parameter, especially after modifying any .env variables.

#### `npm run docker:clean`

Similar to `npm run docker:down`, this command additionally removes orphan containers and all associated images linked to the services specified in [docker-compose.yml](docker/local/docker-compose.yml).

Please bear in mind that you can execute all these commands individually for each service. In other words, running `npm run docker:up <service_name>` will perform the designated action for the specified `<service_name>` (where `<service_name>` corresponds to one of the services listed in [docker-compose.yml](docker/local/docker-compose.yml)). Furthermore, detailed instructions for each command can be accessed by running `npm run docker:<command> --help`.

### Podman Scripts

---

These `podman-compose` commands offer comprehensive management of your containers.

#### `npm run podman:up`

Initiates the building and starting of Podman containers. It's the primary command to use when starting from a clean state, handling the creation and launch of necessary containers and networks. For background execution, append `-d`.

#### `npm run podman:down`

Stops and removes Podman containers, effectively erasing all data within the database and other services. Ideal for a complete reset or when focusing solely on the `backend` service.

#### `npm run podman:start`

Restarts previously stopped containers, ensuring continued operation without a full restart.

#### `npm run podman:stop`

Halts running Podman containers without deleting them, allowing for temporary suspension of services.

#### `npm run podman:restart`

Performs a full restart of all Podman services, akin to executing `npm run podman:stop` followed by `npm run podman:start`.

#### `npm run podman:logs`

Enables live monitoring of logs from each service. Due to Podman's constraints, logs are fetched individually for each service:

- `npm run podman:logs:backend` for backend logs.
- `npm run podman:logs:db` for database logs.
- `npm run podman:logs:pgadmin` for pgAdmin logs.
- `npm run podman:logs:redis` for Redis logs.

#### `npm run podman:rebuild`

Rebuilds the services, or a specific service if specified. Useful after modifying `.env` variables or making other significant changes.

#### `npm run podman:clean`

Similar to `npm run podman:down`, but also removes orphan containers and associated images as defined in [docker-compose.yml](podman/local/docker-compose.yml).

Just like with Docker, these commands can be executed for individual services. For instance, `npm run podman:up <service_name>` specifically targets the `<service_name>` listed in [docker-compose.yml](podman/local/docker-compose.yml). For detailed instructions on each command, run `npm run podman:<command> --help`.

### Troubleshooting

#### Port in Use

Port in use trying to create a new postgres instance? You'll want to see what process is running on your port with `sudo lsof -i tcp:<PORT>`. For Postgres,run `sudo lsof -i tcp:5432` in your terminal to see what is running on the port you are trying to use.

It should return something like this:

| COMMAND   | PID  | USER | ...more columns ->  |
| --------- | ---- | ---- | ------------------- |
| something | 1337 | user | ... more columns -> |

Use the `PID` from the table to `sudo kill <PID>` in this case, `sudo kill 1337`. You can rerun the `lsof -i tcp:<PORT>` command again to verify the process has been killed. Once killed, you can try setup again via docker or self hosting.

#### Incorrect Database Configuration provided in .env

```
ConnectionError [SequelizeConnectionError]: getaddrinfo EAI_AGAIN
```

This error can happen if Sequelize cannot connect to your hostname. In our testing, this specifically affected Podman containers and trailing whitespace after a variable (hostname) in the env. This would cause the following error during a Podman initialization.

```
Error seeding the database: ConnectionError [SequelizeConnectionError]: getaddrinfo EAI_AGAIN db
    at Client._connectionCallback (/app/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:143:24)
    at Client._handleErrorWhileConnecting (/app/node_modules/pg/lib/client.js:327:19)
    at Client._handleErrorEvent (/app/node_modules/pg/lib/client.js:337:19)
    at Connection.emit (node:events:514:28)
    at Socket.reportStreamError (/app/node_modules/pg/lib/connection.js:58:12)
    at Socket.emit (node:events:514:28)
    at emitErrorNT (node:internal/streams/destroy:151:8)
    at emitErrorCloseNT (node:internal/streams/destroy:116:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  parent: Error: getaddrinfo EAI_AGAIN db
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:118:26) {
    errno: -3001,
    code: 'EAI_AGAIN',
    syscall: 'getaddrinfo',
    hostname: 'db '
  },
  original: Error: getaddrinfo EAI_AGAIN db
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:118:26) {
    errno: -3001,
    code: 'EAI_AGAIN',
    syscall: 'getaddrinfo',
    hostname: 'db '
  }
}

```
