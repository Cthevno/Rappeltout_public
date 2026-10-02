import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const ALLOWED_THEMES = [
    'PARCHMENT',
    'GRYFFINDOR',
    'SLYTHERIN',
    'RAVENCLAW',
    'HUFFLEPUFF',
] as const;

type Theme = (typeof ALLOWED_THEMES)[number];

/**
 * @brief Checks whether a value is a valid backend theme.
 * @param value (unknown) Value to validate.
 * @return true if the value is a supported theme, otherwise false.
 */
function is_theme(value: unknown): value is Theme {
    return (
        typeof value === 'string' &&
        ALLOWED_THEMES.includes(value as Theme)
    );
}

/**
 * @brief Saves the authenticated user's visual theme.
 * @details
 * The request must contain a valid theme value.
 * The theme is stored in the User model and can then
 * be restored on future sessions and other devices.
 */
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }

    if (
        typeof body !== 'object' ||
        body === null ||
        !('theme' in body)
    ) {
        return json(
            { error: 'Theme is required' },
            { status: 400 }
        );
    }

    const theme = body.theme;

    if (!is_theme(theme)) {
        return json(
            { error: 'Invalid theme' },
            { status: 400 }
        );
    }

    try {
        await prisma.user.update({
            where: {
                id: locals.user.id
            },
            data: {
                theme
            }
        });
    } catch {
        return json(
            { error: 'Unable to save theme' },
            { status: 500 }
        );
    }

    return json({
        success: true,
        theme
    });
}