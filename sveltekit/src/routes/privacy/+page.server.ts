import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    return {
        isConnected: !!locals.user,
        seo: { title: 'Politique de confidentialité - Rappeltout' }
    };
};
