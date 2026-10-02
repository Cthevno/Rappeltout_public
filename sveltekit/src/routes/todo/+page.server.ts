import { prisma } from '$lib/server/prisma'
import { redirect, fail } from '@sveltejs/kit';
import { create_notification } from '$lib/server/notification';

export const actions = {
	create: async ({ request, locals }) => {

		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		//Retrieving form data
		const formData = await request.formData();
		const task = formData.get("task")?.toString().trim() ?? '';
		const date = formData.get("date");
		const endedAt = date ? new Date(date as string) : null;

		//Checking that the data is not null before using it
		if (!task)
			return fail(400, { error: "Champs obligatoires manquants" });

		if (task.length > 500)
			return fail(400, { error: "La tâche ne doit pas dépasser 500 caractères" });

		if (endedAt) {
			if (isNaN(endedAt.getTime()))
				return fail(400, { error: "Date limite invalide" });

			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);
			if (endedAt < today)
				return fail(400, { error: "La date limite ne peut être antérieure à aujourd'hui" });
		}

		//Store in the database
		await prisma.task.create({
			data: {
				nameTask: task,
				endedAt: endedAt,
				userId: locals.user.id,
			}
		});

	},

	check: async ({ request, locals }) => {
		// If the user is not logged in, redirect them to the login page
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id) || id <= 0)
			return fail(400, { taskError: "Identifiant de tâche invalide" });

		//We re-read the actual state from the database rather than trusting isFinish sent by the client (avoids a desync if several tabs/requests are open)
		const task = await prisma.task.findFirst({
			where: { id, userId: locals.user.id }
		});
		if (!task)
			return fail(404, { taskError: "Ressource non trouvée" });

		// Toggles the task completion state.
		await prisma.task.update({
			where: { id },
			data: {
				isFinish: !task.isFinish,
				finishedAt: task.isFinish ? null : new Date()
			}
		});

	},

	delete: async ({ request, locals }) => {
		// If the user is not logged in, redirect them to the login page
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id) || id <= 0)
			return fail(400, { taskError: "Identifiant de tâche invalide" });
		//Deletes the task from the database
		const result = await prisma.task.deleteMany({
			where: {
				id,
				userId: locals.user.id
			}
		});
		if (result.count === 0)
			return fail(404, { taskError: "Ressource non trouvée" });

	},

	deleteChecked: async ({ locals }) => {
		// If the user is not logged in, redirect them to the login page
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		//Deletes all of the user's checked tasks
		await prisma.task.deleteMany({
			where: {
				userId: locals.user.id,
				isFinish: true
			}
		});

	},

	edit: async ({ locals, request }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		//Retrieving form data
		const formData = await request.formData();
		const task = formData.get("task")?.toString().trim() ?? '';
		const date = formData.get("date");
		const endedAt = date ? new Date(date as string) : null;

		//Checking that the data is not null before using it
		if (!task)
			return fail(400, { error: "Champs obligatoires manquants" });

		if (task.length > 500)
			return fail(400, { error: "La tâche ne doit pas dépasser 500 caractères" });

		if (endedAt) {
			if (isNaN(endedAt.getTime()))
				return fail(400, { error: "Date limite invalide" });

			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);
			if (endedAt < today)
				return fail(400, { error: "La date limite ne peut être antérieure à aujourd'hui" });
		}

		const id = Number(formData.get('id'));
		if (!Number.isInteger(id) || id <= 0)
			return fail(400, { taskError: "Identifiant de tâche invalide" });

		const result = await prisma.task.updateMany({
			where: {
				id,
				userId: locals.user.id
			},
			data: {
				nameTask: task,
				endedAt: endedAt,
				overdueNotifiedAt: null,
			}
		});
		if (result.count === 0)
			return fail(404, { taskError: "Ressource non trouvée" });

	}
}

// Retrieves the data from Prisma and returns it to the frontend
export const load = async ({ locals }) => {
	if (!locals.user)
		throw redirect(303, '/auth/welcome');

	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);

	// Retrieves overdue tasks that have not yet generated a notification.
	const overdueTasks = await prisma.task.findMany({
		where: {
			userId: locals.user.id,
			isFinish: false,
			endedAt: {
				lt: today
			},
			overdueNotifiedAt: null
		}
	});

	for (const task of overdueTasks) {
		await create_notification(
			task.userId,
			'TASK',
			'Tâche en retard',
			`La tâche "${task.nameTask}" est en retard.`,
			'/todo'
		);

		await prisma.task.update({
			where: {
				id: task.id
			},
			data: {
				overdueNotifiedAt: new Date()
			}
		});
	}

	const tasks = await prisma.task.findMany({
		where: {
			userId: locals.user.id
		}
	});

	return {
		tasks,
		seo: {
			title: "Mes tâches - Rappeltout"
		}
	};
}
