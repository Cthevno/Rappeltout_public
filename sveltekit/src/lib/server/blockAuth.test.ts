import { describe, it, expect, vi } from 'vitest';
import { blockAuth } from './blockAuth';

vi.mock('@sveltejs/kit', () => ({
    redirect: (status: number, location: string) => {
        const error = new Error('Redirect');
        (error as any).status = status;
        (error as any).location = location;
        throw error;
    }
}));

describe('blockAuth', () => {

    it('must redirect inot /home when user already connected', () => {
        const simulateUser = { user: { id: 1, username: 'test' } };

        expect(() => blockAuth(simulateUser as any)).toThrow();
    });

    it('nothing must appen if user not connected', () => {
        const simulateUser = { user: null };

        expect(() => blockAuth(simulateUser as any)).not.toThrow();
    });

});