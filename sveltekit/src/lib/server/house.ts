import { prisma } from '$lib/server/prisma';

/**
 * @brief Where clause identifying a user's household.
 * @details A user belongs to a household if they are its creator or if they are among its members (at most one household per user).
 * @param userId (number) The user's identifier.
 * @return The corresponding Prisma where clause, to pass to a query on the House model.
 */
export function userHouseWhere(userId: number) {
    return {
        OR: [
            { creatorId: userId },
            { members: { some: { id: userId } } }
        ]
    };
}

/**
 * @brief Indicates whether the user already has a household.
 * @param userId (number) The user's identifier.
 * @return (Promise<boolean>) true if the user is the creator or a member of a household.
 */
export async function userHasHouse(userId: number): Promise<boolean> {
    const house = await prisma.house.findFirst({ where: userHouseWhere(userId) });
    return !!house;
}
