import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.ts';
import { prisma } from '$lib/server/prisma';
import { userHasHouse } from '$lib/server/house.js';

vi.mock('$lib/server/house.js', () => ({
    userHasHouse: vi.fn(),
}));

vi.mock('$lib/server/prisma', () => ({
    prisma:
    {
        user: {
            findUnique: vi.fn()
        },
        notification: {
            findMany: vi.fn()
        }
    }
}));

describe('Page home test', () => {
    it('should redirect to /auth/welcome if user is not authenticate', async () => {

        //------- create fake locals user
        const locals = { user: null };

        try {
            await load({ locals } as any);
            expect.fail('Should have thrown a redirect');
        } catch (error: any) {
            expect(error.status).toBe(303);
            expect(error.location).toBe('/auth/welcome');
        }
    });

    it('should return correct house data when user has a house', async () => {

        vi.mocked(prisma.notification.findMany).mockResolvedValue([]);

        //------- simulate hadHouse function with no error
        vi.mocked(userHasHouse).mockResolvedValue(true);

        //------- create fake user
        const simulateUser = { id: '1', username: 'test' };
        //------- create fake locals user
        const locals = { user: simulateUser };

        //------- simulate infos to put in result of prisma search
        const mockDataHouse = {
            code: 'LUMOS-42',
            members: [1, 2],
            pendingMembers: [1],
            sharedTasks: [
                { id: 't1', isFinish: false, assignees: [{ id: '1' }] },
                { id: 't2', isFinish: true, assignees: [] },
                { id: 't3', isFinish: false, assignees: [{ id: '2' }] },
                { id: 't4', isFinish: false, assignees: [] },
            ],
            monsters: [
                {
                    currentHp: 50,
                    maxHp: 100,
                    template: { name: 'Dragon' }
                }
            ]
        }

        const mockProfil = {
            totalXP: 50,
            avatar: 'url/img.png'
        }

        //------- simulate prisma search and result
        vi.mocked(prisma.user.findUnique)
            .mockResolvedValueOnce({ housesJoined: [mockDataHouse] } as any)
            .mockResolvedValueOnce(mockProfil as any);

        //------- simulate load function
        const result = await load({ locals } as any);

        //------- simulate result
        expect(result.user.username).toBe('test');
        expect(result.houseData.houseCode).toBe('LUMOS-42');
        expect(result.houseData.monsterName).toBe('Dragon');
        expect(result.houseData.currentPV).toBe(50);
        expect(result.houseData.maxPV).toBe(100);
        expect(result.houseData.members).toBe(2);
        expect(result.houseData.pendingMembers).toBe(1);
        expect(result.houseData.totalTasks).toBe(4);
        expect(result.houseData.todoTasks).toBe(3);
        expect(result.houseData.finishTasks).toBe(1);
        expect(result.houseData.mineTasks).toBe(2);
        expect(result.houseData.totalXP).toBe(50);
        expect(result.houseData.currentAvatar).toBe('url/img.png');
        expect(result.notifications).toEqual([]);
    });

    it('should return default values when user has no house or empty data', async () => {

        vi.mocked(prisma.notification.findMany).mockResolvedValue([]);

        //------- simulate hadHouse function with no error
        vi.mocked(userHasHouse).mockResolvedValue(false);

        //------- create fake user
        const simulateUser = { id: '1', username: 'test' };
        //------- create fake locals user
        const locals = { user: simulateUser };

        //------- simulate infos to put in result of prisma search
        const mockDataHouse = {
            housesJoined: []
        }

        const mockProfil = {
            totalXP: 0,
            avatar: null
        }

        //------- simulate prisma search and result
        vi.mocked(prisma.user.findUnique)
            .mockResolvedValueOnce({ housesJoined: [mockDataHouse] } as any)
            .mockResolvedValueOnce(mockProfil as any);

        //------- simulate load function
        const result = await load({ locals } as any);

        //------- simulate result
        expect(result.user.username).toBe('test');
        expect(result.houseData.houseCode).toBe(null);
        expect(result.houseData.monsterName).toBe('Pas encore de monstre actif, cliquez ici');
        expect(result.houseData.currentPV).toBe(0);
        expect(result.houseData.maxPV).toBe(0);
        expect(result.houseData.members).toBe(0);
        expect(result.houseData.pendingMembers).toBe(0);
        expect(result.houseData.totalTasks).toBe(0);
        expect(result.houseData.todoTasks).toBe(0);
        expect(result.houseData.finishTasks).toBe(0);
        expect(result.houseData.mineTasks).toBe(0);
        expect(result.houseData.totalXP).toBe(0);
        expect(result.houseData.currentAvatar).toBe(null);
        expect(result.notifications).toEqual([]);
    });
})