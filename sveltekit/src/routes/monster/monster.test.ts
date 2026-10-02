import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { activateOrSpawnNextMonster } from '$lib/server/monster';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        house: {
            findFirst: vi.fn(),
        },
        monster: {
            findFirst: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
        },
        monsterLoot: {
            findFirst: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        }
    }
}));

vi.mock('$lib/server/monster', () => ({
    activateOrSpawnNextMonster: vi.fn(),
}));

vi.mock('$lib/server/socketInstance', () => ({
    getIO: vi.fn(() => null),
}));

vi.mock('$lib/server/monsterWebSockets', () => ({
    notifyMonsterUpdated: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

const MAX_LOOT_LENGTH = 60;

describe("monster page - load", () => {

    it("redirect to /auth/welcome if user isn't connected", async () => {
        await expect(
            load({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("No household found, redirect to /house/create", async () => {
        const locals = { user: { id: 1, role: 'HEADMASTER' } };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        await expect(
            load({ locals } as any)).rejects.toMatchObject({
                status: 303,
                location: "/house/create"
            });
    });

    it("returns the active monster and player scores when a household and an active monster exist", async () => {
        const locals = { user: { id: 1, role: 'HEADMASTER' } };

        const fakeHouse = {
            code: "IMPERO-367",
            houseName: "My household",
            members: [{ id: 1, username: "John", avatar: "wizard.png" }]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const fakeMonster = {
            id: 10,
            status: 'ACTIVE',
            escapeDate: new Date(Date.now() + 86400000), // Tomorow
            houseId: "IMPERO-367",
            template: { name: "GrimDust" },
            combatLogs: [
                { userId: 1, dmg: 50, user: { username: "John" } }
            ],
            monsterLoots: []
        };
        (prisma.monster.findFirst as any).mockResolvedValue(fakeMonster);

        const result = await load({ locals } as any);

        expect(result).toEqual({
            activeMonster: fakeMonster,
            houseCode: "IMPERO-367",
            houseName: "My household",
            players: [
                { id: 1, login: "John", score: 50, avatar: "wizard.png" }
            ],
            current_user: {
                id: 1,
                role: 'HEADMASTER'
            }
        });
    });

    it("returns the active monster and player scores when a household exist but there is no activeMonster yet", async () => {
        const locals = { user: { id: 1, role: 'HEADMASTER' } };

        const fakeHouse = {
            code: "IMPERO-367",
            houseName: "My household",
            members: [{ id: 1, username: "John", avatar: "wizard.png" }]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        (prisma.monster.findFirst as any).mockResolvedValue(null);

        const fakeSpawnedMonster = {
            id: 20,
            status: 'ACTIVE',
            houseId: "IMPERO-367",
            template: { name: "Dragon" },
            combatLogs: [],
            monsterLoots: []
        };
        (activateOrSpawnNextMonster as any).mockResolvedValue(fakeSpawnedMonster);

        const result = await load({ locals } as any);
        expect(activateOrSpawnNextMonster).toHaveBeenCalledWith("IMPERO-367");
        expect((result as any).activeMonster).toEqual(fakeSpawnedMonster);
    });

    it("returns the active monster and player scores when a household exist but the activeMonster escaped", async () => {
        const locals = { user: { id: 1, role: 'HEADMASTER' } };

        const fakeHouse = {
            code: "IMPERO-367",
            houseName: "My household",
            members: [{ id: 1, username: "John", avatar: "wizard.png" }]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const escapedMonster = {
            id: 10,
            status: 'ACTIVE',
            escapeDate: new Date(Date.now() - 86400000),
            houseId: "IMPERO-367",
            template: { name: "GrimDust" },
            combatLogs: [
                { userId: 1, dmg: 50, user: { username: "John" } }
            ],
            monsterLoots: []
        };
        (prisma.monster.findFirst as any).mockResolvedValue(escapedMonster);

        const fakeSpawnedMonster = {
            id: 20,
            status: 'ACTIVE',
            houseId: "IMPERO-367",
            template: { name: "Dragon" },
            combatLogs: [],
            monsterLoots: []
        };
        (activateOrSpawnNextMonster as any).mockResolvedValue(fakeSpawnedMonster);

        const result = await load({ locals } as any);
        expect(activateOrSpawnNextMonster).toHaveBeenCalledWith("IMPERO-367");
        expect(prisma.monster.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { status: 'FINISHED' }
        });
        expect((result as any).activeMonster).toEqual(fakeSpawnedMonster);
    });

    it("correctly calculates and aggregates player scores from combat logs", async () => {
        const locals = { user: { id: 1, role: 'HEADMASTER' } };

        const fakeHouse = {
            code: "IMPERO-367",
            houseName: "My household",
            members: [
                { id: 1, username: "John", avatar: "wizard.png" },
                { id: 2, username: "Jane", avatar: "toad.png" }
            ]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const fakeMonster = {
            id: 10,
            status: 'ACTIVE',
            escapeDate: new Date(Date.now() + 86400000),
            houseId: "IMPERO-367",
            template: { name: "Gobelin" },
            combatLogs: [
                { userId: 1, dmg: 30, user: { username: "John" } },
                { userId: 1, dmg: 20, user: { username: "John" } }
            ],
            monsterLoots: []
        };
        (prisma.monster.findFirst as any).mockResolvedValue(fakeMonster);

        const result = await load({ locals } as any);

        expect((result as any).players).toEqual([
            { id: 1, login: "John", score: 50, avatar: "wizard.png" },
            { id: 2, login: "Jane", score: 0, avatar: "toad.png" }
        ]);
    });
});

describe("monster page - actions", () => {

    describe("updateLootType", () => {

        it("redirect to /auth/welcome if user isn't connected", async () => {
            await expect(
                actions.updateLootType({ locals: { user: null } } as any)
            ).rejects.toMatchObject({
                status: 303,
                location: "/auth/welcome"
            });
        });

        it("returns fail 400 if both monsterId and LootType are missing", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            const request = {
                formData: async () => formData
            };
            const result = await actions.updateLootType({ request, locals } as any);
            expect(result).toEqual({
                status: 400,
                data: { error: "Données manquantes" }
            });
        });

        it("returns fail 400 if monsterId is missing", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('lootType', 'COLLECTIVE');
            const request = {
                formData: async () => formData
            };
            const result = await actions.updateLootType({ request, locals } as any);
            expect(result).toEqual({
                status: 400,
                data: { error: "Données manquantes" }
            });
        });

        it("returns fail 400 if LootType is missing", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            const request = {
                formData: async () => formData
            };
            const result = await actions.updateLootType({ request, locals } as any);
            expect(result).toEqual({
                status: 400,
                data: { error: "Données manquantes" }
            });
        });

        it("returns fail 403 if user role is STUDENT", async () => {
            const locals = { user: { id: 1, role: 'STUDENT' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('lootType', 'COLLECTIVE');
            const request = { formData: async () => formData };

            const result = await actions.updateLootType({ request, locals } as any);

            expect(result).toEqual({
                status: 403,
                data: { error: "Votre statut dans le foyer ne vous permet pas de modifier le type de butin" }
            });
            expect(prisma.monster.findFirst).not.toHaveBeenCalled();
            expect(prisma.monster.update).not.toHaveBeenCalled();
        });

        it.each(['HEADMASTER', 'TEACHER'])(
            "allows %s to modifie loot type",
            async (role) => {
                const locals = { user: { id: 1, role } };
                const formData = new FormData();
                formData.append('monsterId', '10');
                formData.append('lootType', 'INDIVIDUAL');
                const request = { formData: async () => formData };

                (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
                (prisma.monster.update as any).mockResolvedValue({});

                const result = await actions.updateLootType({ request, locals } as any);

                expect(prisma.monster.update).toHaveBeenCalledWith({
                    where: { id: 10 },
                    data: { lootType: 'INDIVIDUAL' }
                });
                expect(result).toEqual({ success: true });
            }
        );

        it("returns fail 404 if the monster does not exist or does not belong to the household", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('lootType', 'COLLECTIVE');

            const request = {
                formData: async () => formData
            };

            (prisma.monster.findFirst as any).mockResolvedValue(null);
            const result = await actions.updateLootType({ request, locals } as any);

            expect(result).toEqual({
                status: 404,
                data: { error: "Monster doesn't exist" }
            });
        });

        it("successfully updates the loot type and returns success: true", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('lootType', 'COLLECTIVE');

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
            (prisma.monster.update as any).mockResolvedValue({});

            const result = await actions.updateLootType({ request, locals } as any);

            expect(prisma.monster.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { lootType: 'COLLECTIVE' }
            });
            expect(result).toEqual({ success: true });
        });

        it("returns fail 500 if a database error occurs during update", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('lootType', 'COLLECTIVE');

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
            (prisma.monster.update as any).mockRejectedValue(new Error("DB crash"));

            const result = await actions.updateLootType({ request, locals } as any);

            expect(result).toEqual({
                status: 500,
                data: { error: "Erreur serveur" }
            });
        });
    });

    describe("monster - actions updateCollectiveLoot", () => {

        it("redirect to /auth/welcome if user isn't connected", async () => {
            await expect(
                actions.updateCollectiveLoot({ locals: { user: null } } as any)
            ).rejects.toMatchObject({
                status: 303,
                location: "/auth/welcome"
            });
        });

        it("returns fail 400 if monsterId is missing", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('collectiveLoot', 'La famille va au cinema samedi soir !');
            const request = {
                formData: async () => formData
            };
            const result = await actions.updateCollectiveLoot({ request, locals } as any);
            expect(result).toEqual({
                status: 400,
                data: { error: "ID manquant" }
            });
        });

        it("returns fail 400 if rawCollectiveLoot is not a string", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };

            const request = {
                formData: async () => ({
                    get: (key: string) => {
                        if (key === 'monsterId') return 10;
                        if (key === 'collectiveLoot') return 123;
                    }
                })
            };

            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(result).toEqual({
                status: 400,
                data: { error: "Champ collectiveloot manquant." }
            });
        });

        it("returns fail 400 if collectiveLoot exceeds MAX_LOOT_LENGTH", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('collectiveLoot', 'a'.repeat(MAX_LOOT_LENGTH + 1));

            const request = { formData: async () => formData };
            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(result).toEqual({
                status: 400,
                data: { error: `Loot can't be larger than ${MAX_LOOT_LENGTH} characters` }
            });
        });

        it("returns fail 403 if role is STUDENT and doesn't allow to modifie collectiveLoot", async () => {
            const locals = { user: { id: 1, role: 'STUDENT' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('collectiveLoot', 'Butin proposé par un élève');
            const request = { formData: async () => formData };

            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(result).toEqual({
                status: 403,
                data: { error: "Votre statut dans le foyer ne vous permet pas de modifier le butin collectif" }
            });
            expect(prisma.monster.findFirst).not.toHaveBeenCalled();
            expect(prisma.monster.update).not.toHaveBeenCalled();
        });

        it.each(['HEADMASTER', 'TEACHER'])(
            "Allows a %s to modifie collective loot",
            async (role) => {
                const locals = { user: { id: 1, role } };
                const formData = new FormData();
                formData.append('monsterId', '10');
                formData.append('collectiveLoot', 'Nouveau butin validé');
                const request = { formData: async () => formData };

                (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
                (prisma.monster.update as any).mockResolvedValue({});

                const result = await actions.updateCollectiveLoot({ request, locals } as any);

                expect(prisma.monster.update).toHaveBeenCalledWith({
                    where: { id: 10 },
                    data: { collectiveLoot: 'Nouveau butin validé' }
                });
                expect(result).toEqual({ success: true });
            }
        );

        it("returns fail 404 if the monster does not exist", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '999');
            formData.append('collectiveLoot', 'Super loot collectif !');

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue(null);

            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(result).toEqual({
                status: 404,
                data: { error: "Monster doesn't exist" }
            });
        });

        it("successfully updates the collective loot and returns success: true", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('collectiveLoot', 'Nouveau loot collectif validé !');

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
            (prisma.monster.update as any).mockResolvedValue({});

            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(prisma.monster.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { collectiveLoot: 'Nouveau loot collectif validé !' }
            });

            expect(result).toEqual({ success: true });
        });

        it("returns fail 500 if a database error occurs during collective loot update", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('collectiveLoot', 'Loot test crash');

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
            (prisma.monster.update as any).mockRejectedValue(new Error("DB error"));

            const result = await actions.updateCollectiveLoot({ request, locals } as any);

            expect(result).toEqual({
                status: 500,
                data: { error: "Erreur serveur" }
            });
        });
    });

    describe("monster - actions updateIndividualLoots", () => {

        it("redirects to /auth/welcome if user isn't connected", async () => {
            const request = { formData: async () => new FormData() };

            await expect(
                actions.updateIndividualLoots({ request, locals: { user: null } } as any)
            ).rejects.toMatchObject({
                status: 303,
                location: "/auth/welcome"
            });
        });

        it("returns fail 400 if monsterId or lootsData is missing", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();

            const request = { formData: async () => formData };
            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect(result).toEqual({
                status: 400,
                data: { error: "Données manquantes" }
            });
        });

        it("returns fail 400 if lootsDataJson is not valid JSON", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');
            formData.append('lootsData', 'invalid-json-string');

            const request = { formData: async () => formData };
            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect(result).toEqual({
                status: 400,
                data: { error: "Format de données invalide" }
            });
        });

        it("returns fail 400 if any individual loot exceeds MAX_LOOT_LENGTH", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');

            const lootsData = { "2": "a".repeat(61) }
            formData.append('lootsData', JSON.stringify(lootsData));

            const request = { formData: async () => formData };
            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect((result as any).status).toBe(400);
            expect((result as any).data.error).toContain("dépasse");
        });

        it("returns fail 404 if monster doesn't exist", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '999');
            formData.append('lootsData', JSON.stringify({ "2": "Super loot" }));

            const request = { formData: async () => formData };
            (prisma.monster.findFirst as any).mockResolvedValue(null);

            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect(result).toEqual({
                status: 404,
                data: { error: "monster doesn't exist" }
            });
        });

        it("A STUDENT can modifie it's own loot", async () => {
            const locals = { user: { id: 2, role: 'STUDENT' } };
            const formData = new FormData();
            formData.append('monsterId', '10');

            const lootsData = {
                "2": "Mon loot à moi",       // son propre loot
                "3": "Loot d'un autre joueur" // ne doit pas être touché
            };
            formData.append('lootsData', JSON.stringify(lootsData));

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
            (prisma.monsterLoot.findFirst as any).mockResolvedValue(null);
            (prisma.monsterLoot.create as any).mockResolvedValue({});

            const result = await actions.updateIndividualLoots({ request, locals } as any);

            // findFirst ne doit être appelé qu'une fois, pour le loot autorisé (userId 2)
            expect(prisma.monsterLoot.findFirst).toHaveBeenCalledTimes(1);
            expect(prisma.monsterLoot.findFirst).toHaveBeenCalledWith({
                where: { monsterId: 10, userId: 2 }
            });

            expect(prisma.monsterLoot.create).toHaveBeenCalledTimes(1);
            expect(prisma.monsterLoot.create).toHaveBeenCalledWith({
                data: { monsterId: 10, userId: 2, content: "Mon loot à moi" }
            });

            expect(result).toEqual({ success: true });
        });

        it.each(['HEADMASTER', 'TEACHER'])(
            "A %s can modifie the loot of any user",
            async (role) => {
                const locals = { user: { id: 1, role } };
                const formData = new FormData();
                formData.append('monsterId', '10');

                const lootsData = {
                    "2": "Loot du joueur 2",
                    "3": "Loot du joueur 3"
                };
                formData.append('lootsData', JSON.stringify(lootsData));

                const request = { formData: async () => formData };

                (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });
                (prisma.monsterLoot.findFirst as any).mockResolvedValue(null);
                (prisma.monsterLoot.create as any).mockResolvedValue({});

                const result = await actions.updateIndividualLoots({ request, locals } as any);

                expect(prisma.monsterLoot.create).toHaveBeenCalledTimes(2);
                expect(prisma.monsterLoot.create).toHaveBeenCalledWith({
                    data: { monsterId: 10, userId: 2, content: "Loot du joueur 2" }
                });
                expect(prisma.monsterLoot.create).toHaveBeenCalledWith({
                    data: { monsterId: 10, userId: 3, content: "Loot du joueur 3" }
                });

                expect(result).toEqual({ success: true });
            }
        );

        it("A STUDENT can't edit the individual loot of another player", async () => {
            const locals = { user: { id: 2, role: 'STUDENT' } };
            const formData = new FormData();
            formData.append('monsterId', '10');

            // le joueur 2 tente de vider le loot du joueur 3
            const lootsData = { "3": "" };
            formData.append('lootsData', JSON.stringify(lootsData));

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });

            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect(prisma.monsterLoot.findFirst).not.toHaveBeenCalled();
            expect(prisma.monsterLoot.delete).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it("successfully updates, creates, or deletes individual loots based on content", async () => {
            const locals = { user: { id: 1, role: 'HEADMASTER' } };
            const formData = new FormData();
            formData.append('monsterId', '10');

            const lootsData = {
                "2": "Nouveau texte",
                "3": "Premier message",
                "4": ""
            };
            formData.append('lootsData', JSON.stringify(lootsData));

            const request = { formData: async () => formData };

            (prisma.monster.findFirst as any).mockResolvedValue({ id: 10, houseId: 'IMPERO-367' });

            (prisma.monsterLoot.findFirst as any).mockImplementation(async ({ where }: any) => {
                if (where.userId === 2) return { id: 101, monsterId: 10, userId: 2 };
                if (where.userId === 4) return { id: 102, monsterId: 10, userId: 4 };
                return null;
            });

            (prisma.monsterLoot.update as any).mockResolvedValue({});
            (prisma.monsterLoot.create as any).mockResolvedValue({});
            (prisma.monsterLoot.delete as any).mockResolvedValue({});

            const result = await actions.updateIndividualLoots({ request, locals } as any);

            expect(prisma.monsterLoot.update).toHaveBeenCalledWith({
                where: { id: 101 },
                data: { content: "Nouveau texte" }
            });
            expect(prisma.monsterLoot.create).toHaveBeenCalledWith({
                data: { monsterId: 10, userId: 3, content: "Premier message" }
            });
            expect(prisma.monsterLoot.delete).toHaveBeenCalledWith({
                where: { id: 102 }
            });

            expect(result).toEqual({ success: true });
        });

    });
});