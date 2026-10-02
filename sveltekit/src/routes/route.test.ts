import { describe, it, expect } from 'vitest';
import { load } from './+page.server';

describe('Root Page Load Tests', () => {

	it('redirects to /home if the user is already logged in', async () => {
		const event = {
			locals: { user: { id: 1, username: 'test' } }
		};

		await expect(
			load(event as any)
		).rejects.toMatchObject({
			status: 303,
			location: '/home'
		});
	});

	it('returns seo data when locals.user is null', async () => {
		const event = {
			locals: { user: null }
		};

		const result = await load(event as any);

		expect(result).toEqual({
			seo: {
				title: 'Rappeltout — Organisez vos tâches et rappels',
				description: "Rappeltout est l'application qui vous aide à gérer vos tâches, vos rappels et les corvées de votre foyer en toute simplicité."
			}
		});
	});

});
