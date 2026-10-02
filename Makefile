DOCKER          	:= docker
DOCKER_COMPOSE		:= $(DOCKER) compose -f docker-compose.yml
DOCKER_COMPOSE_DEV	:= $(DOCKER) compose -f docker-compose.yml -f docker-compose.dev.yml

# Check for image updates and pull only if necessary.
all: setup generate-docs
	$(DOCKER_COMPOSE) build --pull
	$(DOCKER_COMPOSE) up -d

fast: setup
	$(DOCKER_COMPOSE) build --pull
	$(DOCKER_COMPOSE) up -d

# Update containers according to code state.
dev: setup dev-deps generate-docs
	$(DOCKER_COMPOSE_DEV) build --pull
	$(DOCKER_COMPOSE_DEV) up -d

# Start Prisma Studio against the Dockerized PostgreSQL database.
# studio: setup
# 	@set -a && . ./.env && set +a && \
# 	$(DOCKER_COMPOSE_DEV) up -d postgresql && \
# 	until $(DOCKER_COMPOSE_DEV) exec -T postgresql pg_isready -d "$$POSTGRES_DB" -U "$$POSTGRES_USER" >/dev/null 2>&1; do \
# 		sleep 1; \
# 	done && \
# 	cd sveltekit && DATABASE_URL=postgresql://$${POSTGRES_USER}:$${POSTGRES_PASSWORD}@localhost:5432/$${POSTGRES_DB}?schema=public npx prisma studio --browser none --port 5555 --schema=./prisma/schema.prisma

# Generate the documentation from the docs stage of the sveltekit dockerfile
generate-docs:
	rm -rf "sveltekit/docs"
	rm -f sveltekit/src/doxygen-main.md
	./extract-doxygen-main.sh
	$(DOCKER) build --target docs -t transcendence-docs sveltekit/
	$(DOCKER) create --name tmp-docs transcendence-docs
	$(DOCKER) cp tmp-docs:/app/docs sveltekit/docs
	$(DOCKER) rm tmp-docs
	rm -f sveltekit/src/doxygen-main.md
	@echo "✅ Doxygen documentation generated"

# Open the doxygen documentation in the browser (or default app that opens html)
display-docs:
	xdg-open sveltekit/docs/html/index.html

# Validate that all fields are present in the .env and that they are not empty.
setup:
	@./check-env.sh
	(cd sveltekit/ && npm install)

# Download needed node packages for editor, and regenerate the Prisma
# client so its types stay in sync with prisma/schema.prisma.
dev-deps:
	(cd sveltekit/ && npm install && npx prisma generate)

# Executes all tests handled by vitest (unit test, E2E, components)
# and install playwright for end to end tests.
test:
	@(cd sveltekit && \
		npm install && \
		npx playwright install && \
		npm run test)

# Runs the server-side tests (+page.server.ts actions, etc.) with a code
# coverage report. Excludes the browser/component project: its multiple
# browser instances aren't compatible with the v8 coverage provider.
test-coverage:
	@(cd sveltekit && npx vitest run --coverage --project server)

# Open the test coverage logs in the browser.
display-test-coverage:
	@xdg-open 'sveltekit/coverage/index.html'

# Run svelte-check to check unused css, accessibility hints
# and TypeScript compiler errors.
check:
	@(cd sveltekit && npm run check)

stop:
	$(DOCKER_COMPOSE) stop

start:
	$(DOCKER_COMPOSE) start

down:
	$(DOCKER_COMPOSE) down

# This removes all the builder cache, system wide (Don't use if you work on another docker projects).
cache-clean:
	$(DOCKER) builder prune -a -f

# Removes the containers and the volumes (and orphaned images).
clean:
	$(DOCKER_COMPOSE) down --volumes --remove-orphans

# Same as clean, also removing images and doxygen generated documentation.
fclean: clean
	$(DOCKER_COMPOSE) down --volumes --rmi all
	rm -rf sveltekit/docs

# Same as fclean, also removing all the SYSTEM builder cache (don't use if you work on another docker project).
fcclean: fclean cache-clean

# Clean volumes and containers.
re: clean all

# Also remove images (and volumes and containers).
rere: fclean all

# Show the docker compose logs (all the containers)
logs:
	$(DOCKER_COMPOSE) logs -f

# Show logs for a specific container.
logs-%:
	$(DOCKER_COMPOSE) logs -f $*

# Display containers state in real time,
# usefull in a terminal split to follow containers start.
ps:
	watch --interval=1 --no-title $(DOCKER_COMPOSE) ps

# Spawn a shell into a specific container.
in-%:
	$(DOCKER) exec -it $* sh

.PHONY: all dev generate-docs display-docs dev-deps setup test test-coverage display-test-coverage check stop start down cache-clean clean fclean fcclean re rere logs ps #studio
