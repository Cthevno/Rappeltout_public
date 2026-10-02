// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Role } from "@prisma/client";
/**
 * @brief Defines application-wide SvelteKit types.
 *
 * @details
 * The App.Locals interface describes data attached to each
 * server request.
 *
 * The user property contains the authenticated user's
 * information when a valid session exists.
 */
declare global {
	namespace App {
		interface Locals {
			user:
			| {
				id: number;
				email: string;
				username: string;
				role: Role;
				theme:
				| "PARCHMENT"
				| "GRYFFINDOR"
				| "SLYTHERIN"
				| "RAVENCLAW"
				| "HUFFLEPUFF";
			}
			| undefined;
		}
	}
}

export { };
