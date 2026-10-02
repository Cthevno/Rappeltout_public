*This project has been created as part of the 42 curriculum by cafavier, ctheveno, juportie, mlaussel and vakozhev.*

## Description

The Transcendence subject left the choice of project open: we chose to build an application called **RappelTout**, a shared household management app built with SvelteKit, Prisma and PostgreSQL.
It lets several users join the same "house" to manage their daily household chores together, keep a personal to-do list, and communicate through a real-time chat.
Authentication supports email/password (with 2FA) and Google OAuth.
The application is also gamified: each completed task earns experience points and deals damage to a monster shared by the household. Once the monster is defeated, the household members are rewarded with a prize they have chosen beforehand, which can be collective or personalized for each member.

## Instructions

### Prerequisites
Before building, the following must be installed on your machine:
- **docker**: build and run the containers.
- **make**: to build and execute commands related to the project (checks, tests, doc...).
- **node**: to run server side javascript and some cli tools.
- **npm**: to manage node packages.
- **bash**: some scripts depends on it.

You also need to create a `.env` file at the root of the project. Here is an example:
```
POSTGRES_DB= The name of the PostgreSQL database automatically created by Docker.
POSTGRES_USER= The admin username used to connect to PostgreSQL.
POSTGRES_PASSWORD= The password associated with the PostgreSQL user.
DATABASE_URL= The full connection URL used by Prisma to connect to PostgreSQL. (format postgresql://user:password@host:port/dbname)
EMAIL_USER= The email address (Gmail Simple Mail Transfer Protocol account) used by the application to send emails.
EMAIL_PASS= The Google app password (a key, not the email account's password). It lets the application connect securely to Google's SMTP server.
GOOGLE_CLIENT_ID= The unique client ID provided by the Google Cloud Console for OAuth authentication (Google sign-in).
GOOGLE_SECRET_ID= The secret key associated with the Google OAuth application, used to secure token exchanges.
GOOGLE_REDIRECT_URI= The redirect URL Google sends the user back to after a successful sign-in.
TZ= The server timezone, so logs show the correct time (e.g. Europe/Paris).
```

### Running the project
Once the `.env` is created, `make` is enough to build and start the Docker containers. Then open `https://localhost:8443` in your browser (the numeric IP, 127.0.0.1, is not configured).

### Editing the database for testing
To view or edit data by hand with Prisma Studio:

- Uncomment the corresponding rule in the Makefile (don't forget to uncomment studio on the .PHONY line too).

- Uncomment the 5432:5432 port in the docker-compose.yml file.

- Run the make studio command.

This starts Prisma Studio on http://localhost:5555 and connects it to the project's PostgreSQL database through the Docker network.

This security measure was introduced to block external direct access to the database from outside the container network.```

Handy for preparing test cases, recreating users/houses, or cleaning up data without touching the code.

### Stopping the project
- `make stop`: pauses the containers without removing them. Data is kept, and `make start` lets you pick up where you left off.
- `make down`: removes the containers but keeps the data (volumes).
- `make clean`: removes the containers and the data (volumes).
- `make fclean`: same as `make clean`, and also removes the Docker images and the generated Doxygen documentation.

## Resources

### Documentation

#### Docker
- https://hub.docker.com/_/postgres

#### Sveltekit
- https://svelte.dev/docs/kit/introduction
- https://svelte.dev/docs
- https://lucide.dev/icons/

#### Postgresql
- https://www.postgresql.org

#### Prisma
- https://www.prisma.io/docs
- https://habr.com/ru/companies/timeweb/articles/654341/
- https://laconsole.dev/formations/prisma/prisma-schema

#### Websocket
- https://socket.io/docs/v4/
- https://svelte.dev/playground/29a5bdfb981f479fb387298aef1190a0?version=5.56.10
- https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- https://ben-knox.com/post/websockets-with-sveltekit

#### Typescript style guide
- https://github.com/airbnb/javascript
- https://google.github.io/styleguide/tsguide.html#comments-documentation
- https://google.github.io/styleguide/tsguide.html
- https://google.github.io/styleguide/tsguide.html#language-features
- https://google.github.io/styleguide/tsguide.html#naming
- https://google.github.io/styleguide/tsguide.html#type-system
- https://google.github.io/styleguide/tsguide.html#comments-documentation

#### Tailwind CSS
- https://tailwindcss.com/docs/styling-with-utility-classes

#### Commit
- https://www.conventionalcommits.org/en/v1.0.0/
- https://github.com/neovim/neovim/blob/master/CONTRIBUTING.md#commit-messages
- https://www.kernel.org/doc/html/latest/process/submitting-patches.html#describe-your-changes
- https://git-scm.com/docs/SubmittingPatches#describe-changes


### Use of AI

- **cafavier**:
  - Explaining new concepts.
  - Translating code comments from French to English.
  - Help with reviews.
  - Help with debugging.
- **ctheveno**:
  - Help finding sources.
  - Senior coding partner to explain new concepts and give critical feedback on the code produced.
  - Generating images for the monsters.
  - Help with debugging.
- **juportie**:
  - Generating Doxygen documentation.
  - Help understanding the stack.
  - Help with debugging.
  - Advice on best practices and the different possible implementations.
- **mlaussel**:
  - Learning and understanding new concepts, especially setting up and how WebSockets work with Socket.IO, as well as configuring unit tests with mocks for the back end.
  - Help with debugging.
  - Writing code summaries, structuring tasks for Jira, and help writing and translating briefs into English.
- **vakozhev**:
  - Learning and understanding new concepts.
  - Understanding certain Git/Docker/Prisma errors and resolving conflicts.
  - Support in checking my own code and, sometimes, in understanding and/or checking parts of my teammates' code during reviews.
  - Support in thinking through the logic of certain implementations (for example, WebSockets).


## Team information

A team of 5 people built this project. Roles were not drawn at random but chosen according to each person's affinities:

- **cafavier** — *Technical Lead*: asked for this role out of an interest in architecture and comparing technologies. Defined the overall technical architecture, chose the tech stack (SvelteKit, Prisma, Docker), supervised code reviews and ensured code quality and consistency.
- **ctheveno** — *Product Owner*: a natural role since the idea for the app (a household management app) was his — he wanted it for his own family. Defined the needs and the product vision, designed the user journeys and the Figma mockups.
- **juportie** — *Scrum Master*: volunteered to manage the organization and follow-up of agile rituals (team meetings, managing the Jira board), tracked the team's progress to identify blockers, set up the unit test configuration and continuous integration/Docker, and documented the merge processes.
- **mlaussel** — *Developer*: did not see themselves in a management role.
- **vakozhev** — *Developer*: did not see themselves in a management role.

As on any project of this size, these roles mostly structured coordination: in practice, everyone coded features (see [Individual Contributions](#individual-contributions)).

## Project Management

- **Communication**: Discord, with several dedicated channels — a daily stand-up, a pull requests channel and a general channel.
- **Meetings**: weekly in-person team meeting every Thursday.
- **Task tracking**: Jira, to break down tasks and track their progress.
- **Code review**: two mandatory reviews on GitHub before merging — one by cafavier (Technical Lead), one by another team member (except for cafavier's PRs, where the other members take turns reviewing).

## Technical Stack

- **Frontend**: SvelteKit (Svelte 5), TailwindCSS, [@lucide/svelte](https://lucide.dev/) and [@iconify/svelte](https://iconify.design/) for icons, Chart.js for charts.
- **Backend**: SvelteKit (adapter-node) run via `tsx`, Prisma ORM, bcryptjs (password hashing), Nodemailer (sending emails).
- **Real time**: Socket.IO (chat).
- **Database**: PostgreSQL.
- **Infrastructure**: Docker / Docker Compose, nginx (reverse proxy + TLS), Makefile for orchestration.
- **Documentation**: Doxygen (automatically generated from code comments).
- **Language**: TypeScript and Svelte.

### Rationale for the choices
- **SvelteKit** (Frontend & Backend): Chosen because it is quick to learn and simplifies route management. SvelteKit keeps front-end and back-end code in separate files that sit logically in the same place in the routes folder, avoiding heavy configuration.
- **PostgreSQL & Prisma** (Database & ORM): PostgreSQL was chosen for its robustness, its efficient handling of complex relations (users, houses, tasks, chat) and its native support for integrity constraints. Prisma was adopted as the ORM for its type safety with TypeScript, its clear syntax and its simple schema migrations.
- **Socket.IO** (Real time): Selected for its robustness, its ease of implementation and its automatic reconnection when the network drops. It natively supports rooms, which turned out to be perfect for instantly isolating a specific house's chat and cleanly handling connections and disconnections between members.


## Database Schema

### Schema
```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o| TwoFA : "has"
    User ||--o| PasswordReset : "has"
    User ||--o{ Task : "creates"
    User ||--o{ Message : "sends"
    User ||--o{ SharedTask : "assigned"
    User }|--o{ House : "housesCreated (HouseCreator)"
    User }|--o{ House : "housesJoined (HouseMembers)"
    User }|--o{ House : "housesPending (HousePending)"
    User }|--o{ House : "housesPendingInvitation (HousePendingInvitation)"
    User ||--o{ CombatLog : "has"
    
    House ||--o{ Monster : "contains"
    House ||--o{ CombatLog: "has"
    House ||--o{ Message : "contains"
    House ||--o{ SharedTask : "contains"

    MonsterTemplate ||--o{ Monster : "has"

    Monster ||--o{ CombatLog : "has"
```

### Other elements in table

- **Message**
  - id: Int (Primary key)
  - content: String (Message content)
  - userId & houseCode: Int && String (Foreign keys linking the author and the house)
- **Session**
  - id: String (Primary key, random)
  - userId: Int (Foreign key linking the session to the user)
  - endedAt: DateTime (Session lifetime)
  - user: User (Relation to the user)
- **TwoFA**
  - id: Int (Primary key, auto-incremented)
  - userId: Int (Foreign key linking the verification to the user, unique)
  - code: String (Verification code)
  - token: String (Mechanism to verify that it is the right person)
  - attempts: Int (Counts the number of attempts before the verification fails)
  - createdAt: DateTime (Creation date)
  - expiresAt: DateTime (Verification lifetime)
  - user: User (Relation to the user)
- **PasswordReset**
  - id: Int (Primary key, auto-incremented)
  - token: String (Unique, secure token sent by email link to validate the request)
  - userId: Int (Foreign key linking the reset to the user, unique)
  - user: User (Relation to the user)
  - createdAt: DateTime (Creation date)
  - expiresAt: DateTime (Reset lifetime)
- **User**
  - id: Int (Primary key, auto-incremented)
  - email: String (Unique, required)
  - username: String (Unique, required)
  - password: String (Optional for some sign-in methods)
  - theme: Theme (Enum: PARCHMENT, GRYFFINDOR, etc.)
  - isFA: Boolean (Whether two-factor authentication is enabled)
  - createdAt: DateTime (Account creation date)
- **House**
  - code: String (Text primary key)
  - houseName: String (Household name)
  - creatorId: Int (Foreign key to the creating user)
  - createdAt: DateTime (Creation date)
- **Task**
  - id: Int (Primary key)
  - userId: Int (Foreign key linking the author to the task)
  - nameTask: String (Task label)
  - isFinish: Boolean (Task status, default false)
  - createdAt / endedAt / finishedAt: DateTime (Time tracking)
- **SharedTask**
  - id: Int (Primary key)
  - houseCode: String (Foreign key linking the task to the house)
  - nameTask: String (Task label)
  - isFinish: Boolean (Task status, default false)
  - difficulty: Difficulty (Enum for shared tasks: SUPER_EASY, EASY, etc.)
  - category: Category (Enum: STUDIES, SPORT, HEALTH, etc.)
  - createdAt / endedAt / finishedAt: DateTime (Time tracking)
- **CombatLog**
  - id: Int (Primary key, auto-incremented)
  - monsterId: Int (Foreign key to the attacked monster)
  - userId: Int? (Optional foreign key to the user who struck)
  - authorName: String? (Fallback author name in case the user account is deleted)
  - houseId: Int (Foreign key to the house concerned)
  - dmg: Int (Damage dealt, default 0)
  - createdAt: DateTime (Date and time of the combat action)
- **Monster**
  - id: Int (Primary key, auto-incremented)
  - templateId: Int (Foreign key to the monster template)
  - houseId: Int or String (Foreign key to the house fighting the monster)
  - difficulty: MonsterDifficulty (Difficulty enum: EASY, MEDIUM, HARD, etc.)
  - maxHp / currentHp: Int (Maximum and current hit points, default 100)
  - status: MonsterStatus (Monster state: ACTIVE, NEXT, FINISHED)
  - killed: Boolean (Whether the monster has been defeated)
  - createdAt / escapeDate / finishedDate: DateTime (Monster lifetime tracking)
- **MonsterTemplate**
  - id: Int (Primary key, auto-incremented)
  - name: String (Unique name of the monster type)
  - imageSrc: String (Path or URL of the monster image)
  - lore: String (Description or story of the monster)

## Features List

### Authentication and Security
- Email sign-in (mlaussel)
- Google sign-in (OAuth 2.0) (mlaussel)
- Forgotten password / reset (secure token sent) (mlaussel)
- Two-factor authentication (2FA) (mlaussel)
- Account creation (mlaussel)
- Sign-out (mlaussel)
- Welcome email (mlaussel)

### Household (House)
- Create a household (cafavier)
- Join a household (cafavier)

### App in general
- Change theme, Home page (vakozhev)
- Send notifications (vakozhev, mlaussel)

### House (household page)
- Invite a member to join the household (cafavier, juportie)
- View the list of household members and open a member's profile by clicking on it (juportie)

### Manage house
- Accept a request to join the household (cafavier)
- Reject a request to join the household (cafavier)
- Rename the household (cafavier)
- Regenerate the household invitation code (cafavier)
- Resend the owl, i.e. resend the invitation from the house page (cafavier)
- Delete the household (cafavier)
- Change a user's role (vakozhev)
- Transfer headmaster rights to someone else, if headmaster (vakozhev)
- Remove a member from the household (cafavier)
- Leave the household (cafavier)
- Delete a pending invitation (ctheveno)

### Household chores
- Add, check, edit, delete a task; delete checked tasks (cafavier)

### Todo
- Same features as household_chores (cafavier)

### Settings
- Edit personal data, username and password (mlaussel)
- Delete an account (mlaussel)

### Profile
- Change the avatar (juportie, ctheveno)
- Statistics tracking: completed tasks, total XP, damage, defeated monsters (ctheveno)

### Monster
- Edit the individual reward (ctheveno)
- Edit the collective reward (ctheveno)
- Choose between individual and collective reward (ctheveno)
- Deal damage to the monster and defeat it (ctheveno)
- Graph of damage over time with curves (ctheveno)

### Chat
- Send messages (mlaussel)

## Modules

### Web

**Major: Use a framework for both the frontend and backend** (2 pts)
* Use a frontend framework (React, Vue, Angular, Svelte, etc.).
* Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails,
etc.).
* Full-stack frameworks (Next.js, Nuxt.js, SvelteKit) count as both if you use both their frontend and backend capabilities.
  - *Choice*: SvelteKit was chosen for its flexibility, its lightness and its ability to handle both client and server in a unified architecture. Proposed by cafavier (Technical Lead) and approved by the team.
  - *Implementation*: used as the foundation of the project (frontend + backend via `adapter-node`), by the whole team.
  - *Members*: Collective choice, used by the whole team.

**Major: Implement real-time features using WebSockets or similar technology** (2 pts)
* Real-time updates across clients.
* Handle connection/disconnection gracefully. ◦ Efficient message broadcasting.
  - *Choice*: Essential for a smooth instant chat experience, the notification system and task interactions between household members.
  - *Implementation*: Socket.IO configured to provide instant updates, clean connection/disconnection handling and message broadcasting.
  - *Members*: mlaussel, cafavier, ctheveno, vakozhev.

**Major: Allow users to interact with other users** (2 pts)
* A basic chat system (send/receive messages between users).
* A profile system (view user information).
* A friends system (add/remove friends, see friends list).
  - *Choice*: Encourage collaboration and social connection within households (houses).
  - *Implementation*:
    - Chat: real-time sending/receiving of messages between members of a house (mlaussel).
    - Profile: viewing user information (ctheveno) and viewing the profiles of other household members (juportie).
    - Friends: the house system acts as the friends system — sending/accepting an invitation is equivalent to adding a friend, and the member list to the friends list. It is also possible to remove a member from the household (cafavier).
  - *Members*: mlaussel (chat), ctheveno (profile), cafavier (manage_house), juportie (dynamic profiles).

**Minor: Use an ORM for the database** (1 pt)
  - *Choice*: Prisma, proposed by cafavier and approved by a vote of the whole team. It also optimizes SQL queries.
  - *Implementation*: Prisma coupled with PostgreSQL.
  - *Members*: collective choice, used by the whole team.

**Minor: A complete notification system for all creation, update, and deletion actions.** (1 pt)
  - *Choice*: Inform users in real time of important actions (invitations, overdue tasks, member management).
  - *Implementation*: Interactive, clickable notification center connected to household events and live thanks to websockets.
  - *Member*: vakozhev

**Minor: Real-time collaborative features (shared workspaces, live editing, collaborative drawing, etc.).** (1 pt)
  - *Choice*: Enable synchronized management of shared tasks within the household.
  - *Implementation*: Live tracking of the state of collaborative household chores and immediate impact on the group's progress.
  - *Member*: cafavier

**Minor: Server-Side Rendering (SSR) for improved performance and SEO.** (1 pt)
  - *Choice*: Ensure optimal loading performance and better indexing of public pages (such as the "About" page).
  - *Implementation*: Native SSR enabled through the SvelteKit router.
  - *Members*: cafavier, mlaussel

**Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).** (1 pt)
  - *Choice*: Provide a consistent, immersive visual identity inspired by the houses of a famous school of magic.
  - *Implementation*: Base components created by cafavier and mlaussel, then expanded by the rest of the team as features were built. Dynamic per-house color palette set up by vakozhev.
  - *Members*: cafavier and mlaussel (base), the whole team (expansion), vakozhev (dynamic theme).

**Web subtotal: 3 Major (6 pts) + 5 Minor (5 pts) = 11 pts**

### Accessibility and Internationalization

**Minor: Support for additional browsers.** (1 pt)
* Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge,
etc.).
* Test and fix all features in each browser.
* Document any browser-specific limitations.
* Consistent UI/UX across all supported browsers.
  - *Choice*: Ensure maximum accessibility for all users, regardless of their preferred browser.
  - *Implementation*: Testing and adjusting the interface on the main browsers on the market (Chrome, Firefox, Safari, Edge).
  - *Members*: The whole team

**Accessibility and Internationalization subtotal: 1 Minor (1 pt) = 1 pt**

### User Management

**Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.)** (1 pt)
  - *Choice*: Make signing in easier for users without always having to create a classic password.
  - *Implementation*: External authentication integrated via Google OAuth 2.0.
  - *Member*: mlaussel

**Major: An organization system:** (2 pts)
* Create, edit, and delete organizations.
* Add users to organizations.
* Remove users from organizations.
* View organizations and allow users to perform specific actions within an organization (minimum: create, read, update).
  - *Choice*: Structure the application around closed groups (a household) where users collaborate.
  - *Implementation*: Creating, editing and deleting households. Invitation system by code, member acceptance and role management.
  - *Members*: cafavier, vakozhev

**Minor: Implement a complete 2FA (Two-Factor Authentication) system for the users** (1 pt)
  - *Choice*: Strengthen the security of sensitive user accounts.
  - *Implementation*: Generation of a secure, time-limited 6-digit verification code sent by email via Nodemailer.
  - *Member*: mlaussel

**User Management subtotal: 1 Major (2 pts) + 2 Minor (2 pts) = 4 pts**

### Modules of Choice

**Minor: Doxygen documentation** (1 pt)
  - *Choice*: Have a clean, readable and up to date documentation directly generated from the code comments and accessible from the browser.
  - *Technical challenge*: Doxygen does not natively support `.svelte` files. A custom Python filter (`doxygen_svelte_filter.py`) had to be written to parse their content, and comments were added file by file across the whole project.
  - *Implementation and value added*: automatically generated documentation as a browsable website, which makes understanding the codebase easier.
  - *Members*: set up by cafavier, improved by juportie; Doxygen-format comments were written by each team member on their own code.

**Major: Unit Test** (2 pts)
  - *Choice*: Ensure non-regression (guarantee that adding new features does not break existing ones) and validate the robustness of the business logic. This choice was driven by the desire to secure the project, make Pull Request (PR) reviews easier and simplify the final evaluation.
  - *Implementation and value added*:
    - Initial installation and configuration set up by juportie.
    - Targeted unit tests written to validate the robustness of all the application's inputs.
    - Mocks set up to simulate the behavior of the backend and the database.
    - Automation via GitHub Actions (`unit_test.yml`, `compilation.yml`, `type_check.yml`): no code can be merged (pushed / merged) unless tests, compilation and type checking pass. Set up by cafavier.
  - *Members*: The whole team, set up by juportie

**Modules of Choice subtotal: 1 Major (2 pts) + 1 Minor (1 pt) = 3 pts**


## Individual Contributions

- **cafavier** — mode module (frontend + backend, with create/join on a single page reusing vakozhev's work), todo, household_chores, new_house and manage_house (frontend + backend, including the backend to invite a member to the household by email, even people who don't have an account yet); "Privacy Policy" and "Terms of Service" pages (with mlaussel); set up the dockerization, the Makefile and the Doxygen comments; wrote the README; created the complete Figma mockup of the project; set up automated tests via GitHub Actions (compilation, type checking and unit tests blocking before merge/push); SEO performance; unit tests (mode, new_house, manage_house, household_chores, todo).
- **ctheveno** — monster module (frontend and backend); profile module (frontend + backend); reworked the Figma mockups of the monster and profile pages; UX thinking around short- and long-term user engagement; unit tests for the monster page and the profile page; created the animated Rappeltout logo; implemented the make studio rule in the Makefile, making it easier to view and manipulate the DB with npx prisma studio.
- **juportie** — house module (frontend + backend); dynamic profile routes to show profile pages for each users (frontend + backend); Doxygen configuration; DNS MX record check to validate email domains; improved the Makefile and the dockerization (set up Docker healthchecks, added some qol rules, and a lot of small optimizations/improvements); research on commit conventions and documentation of merge strategies; set up the unit test installation.
- **mlaussel** — complete authentication (frontend + backend) with email sign-in, Google sign-in, account creation, sign-out, forgotten password/reset, welcome email, two-factor authentication; settings (frontend + backend) with editing user information and deleting the account; chat (frontend + backend) with websockets setup; about page (frontend); home page (backend) with websockets; unit tests and mocks for the auth, settings, chat and home pages; notification fixes; wrote the README.
- **vakozhev** — home module (frontend); mode creation screen (frontend, later integrated into the mode module by cafavier); dynamic color theme management (Slytherin, Gryffindor, Hufflepuff, Ravenclaw); the real-time notification system (frontend, backend and websockets); role management; Figma mockup of the authentication; unit tests for house page roles and notifications.
