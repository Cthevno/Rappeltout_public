import { blockAuth } from '$lib/server/blockAuth';
import type { PageServerLoad } from './$types';


/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load: PageServerLoad = async ({ locals }) => {
    blockAuth(locals);
    return {};
}