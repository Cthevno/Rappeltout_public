import { redirect } from '@sveltejs/kit';

/**
 * @brief Check if user already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load = async ({ locals }) => 
{
    if (locals.user) {
        throw redirect(303, '/home');
    }

    return {
        seo: {
            title: 'Rappeltout — Organisez vos tâches et rappels',
            description: "Rappeltout est l'application qui vous aide à gérer vos tâches, vos rappels et les corvées de votre foyer en toute simplicité."
        }
    };
}