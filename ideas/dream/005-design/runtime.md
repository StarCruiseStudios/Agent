# Design: Runtime host

**Layer:** 005, Technical design
**Status:** Draft

This file defines the processes that Archon runs as, how they start and stop, how they communicate, and how work in each component is started. It sits beneath every step, together with [storage](storage.md), and it holds no knowledge of any step.

---

## Processes

| Process | What it is | Lifetime |
|---|---|---|
| **Service** | The one long-running process. It holds every write handle, runs the job runner, and serves clients over local IPC. | Runs from when it is started until it is stopped. |
| **CLI** | The `archon` command that the user runs. It starts and stops the service, and sends the service commands that change no decision. | Exits when its command finishes. |
| **Desktop app** | The [user surface](user-surface.md). It shows what Archon holds and sends the service everything the user states. | Runs while the user keeps it open. |
| **Hook commands** | Commands that agent platforms run at points in a session, such as when a session ends, to tell the service that a session has new events. | Exits as soon as it has delivered its notice. |
| **Exposure process** | The process that an agent starts to read published outputs. | Runs as long as the agent keeps it open. |

All processes are built from one Rust code base and run on Windows, Linux, and macOS. The service uses the tokio asynchronous runtime.

### Handles

Only the service holds write handles. It opens each namespace's write handle through the [storage interface](storage.md) and passes each component only the handles that STO-4 allows. Any Archon process can open read handles through the storage interface, so reading works whether the service is running or not.

## Starting and stopping

The service runs only when it is started. By default it starts when the user runs `archon start`, and it stops when the user runs `archon stop`. A setting in the configuration file starts it at logon instead, as a per-user scheduled task on Windows, a systemd user unit on Linux, or a launchd agent on macOS.

Every time the service starts, it installs Archon's hooks on any supported platform that lacks them, as [Collect](collect.md) requires. It then catches up before it takes new work. It scans each supported platform's session store for sessions and events that it has not recorded, and it resumes every job from the position it last read (STO-7). A session that a platform still keeps is therefore recorded even if it ran while the service was stopped (COL-3).

When the service is not running, a hook command exits without delivering its notice and without affecting the agent's session. A repository snapshot that the hook command takes is kept in the snapshot spool that [Collect](collect.md) defines, and the catch-up scan records it along with whatever the notice would have reported.

## Local IPC

Clients talk to the service through named pipes on Windows and Unix domain sockets on Linux and macOS. Only the user's own account can open them, and the service accepts no connection from the network.

## Job runner

The job runner starts each piece of work in each component. A component registers its jobs with the runner, and each job has one of the following kinds of trigger.

| Trigger | When the job runs |
|---|---|
| **Change beneath** | A namespace that the component can read has new writes after the position the job last read. |
| **Schedule** | A time or an interval set in the configuration. |
| **Request** | A request on the request queue that the job handles, or a command from the user through the CLI or the desktop app. |

Which jobs each component has, and which trigger each job uses, belong to that component's design.

A job that writes a namespace runs alone in that namespace, so each namespace has one writer at a time. Jobs that only read run alongside any other job. The position each job last read is the component's own knowledge, so it is kept in the component's own namespace and survives a restart.

## Request queue

The request queue carries requests to a component from the components above it, such as a request that Collect check a record again (COL-5). The queue belongs to the runtime host and is kept in a namespace of its own. Any component can add a request through the runtime host, and a request records what is asked and nothing about who asked. The component that handles a kind of request reads it from the queue, so it never reads the namespace of a step above it (SEP-4).

## Configuration and logs

The configuration file is kept in the Archon data directory. It holds the location of each supported platform's session store, the schedules of scheduled jobs, and whether the service starts at logon. The service writes its logs to the data directory, and no log leaves the user's machine.

---

## Technical requirements

**RUN-1. Only the service writes.** This serves SEP-2 and STO-10.

- No process other than the service holds a write handle to any namespace.
- Each namespace has at most one job writing to it at any time.

**RUN-2. Starting the service loses no work.** This serves COL-3 and INC-1.

- Every session that a supported platform still keeps when the service starts is recorded after the catch-up scan, including sessions that ran while the service was stopped.
- After a restart, every job resumes from the position it last read, and no write beneath it is skipped or taken in twice.

**RUN-3. A request names what is asked and never who asked.** This serves COL-5.

- No request on the queue identifies the component that added it.
- The result of handling a request is the same whichever component added it.

**RUN-4. The service is reachable only from the user's own account on the user's machine.** This serves DAT-1 and DAT-2.

- The service accepts connections only through named pipes or Unix domain sockets that only the user's account can open.
- The service listens on no network port.

**RUN-5. A stopped service never affects an agent's session.** This serves COL-3, which records sessions as the platform keeps them.

- A hook command run while the service is stopped exits without error, and it delays the agent by no more than the time it takes to write a repository snapshot.
