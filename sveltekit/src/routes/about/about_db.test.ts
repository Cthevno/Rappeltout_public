import { describe, it, expect } from 'vitest';
import { load } from './+page.server';

describe('About Page Load Tests', () => {

    it('should return isConnected true when user exists in locals', async () => {
        const event = {
            locals: { user: { id: 1, username: 'test' } }
        };

        const result = await load(event as any);

        expect(result).toEqual({
            isConnected: true,
            seo: { title: "A propos - Rappeltout" }
        });
    });

    it('should return isConnected false when locals.user is null', async () => {
        const event = {
            locals: { user: null }
        };

        const result = await load(event as any);

        expect(result).toEqual({
            isConnected: false,
            seo: { title: "A propos - Rappeltout" }
        });
    });

});