import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { blockAuth } from '$lib/server/blockAuth';

vi.mock('$lib/server/blockAuth', () => ({
    blockAuth: vi.fn()
}));

describe('Welcome Test Load', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * ===================================
     * USER NOT BLOCKED BECAUSE ALREADY CONNECTED
     * ===================================
     */
    it('return success if everything works', async () => {

        const event = {
            locals: { user: {id : 1} }
        };

        const result = await load(event as any); 

        expect(blockAuth).toHaveBeenCalledWith(event.locals);
        expect(result).toEqual({});
    });

});