import { redirect } from '@sveltejs/kit';

/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home
 */
export function blockAuth(locals: App.Locals) {
    if (locals.user) {
        throw redirect(303, '/home');
    }
}