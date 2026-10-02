import { Role } from "@prisma/client";

/**
 * @brief Lists all actions controlled by the permission system.
 */
export enum Action {
    CREATE_TASK = "CREATE_TASK",
    EDIT_TASK = "EDIT_TASK",
    DELETE_TASK = "DELETE_TASK",
    VALIDATE_TASK = "VALIDATE_TASK",
    INVITE_MEMBER = "INVITE_MEMBER",
    REMOVE_MEMBER = "REMOVE_MEMBER",
    CHANGE_ROLE = "CHANGE_ROLE",
    EDIT_HOUSE = "EDIT_HOUSE",
    LEAVE_HOUSE = "LEAVE_HOUSE",
    TRANSFER_HEADMASTER = "TRANSFER_HEADMASTER",
    MANAGE_LOOT = "MANAGE_LOOT"
}


/**
 * @brief Maps each role to the actions it is allowed to perform.
 */
export const ROLE_ACTIONS: Record<Role, Action[]> = {
    [Role.HEADMASTER]: [
        Action.CREATE_TASK,
        Action.EDIT_TASK,
        Action.DELETE_TASK,
        Action.VALIDATE_TASK,
        Action.INVITE_MEMBER,
        Action.REMOVE_MEMBER,
        Action.CHANGE_ROLE,
        Action.EDIT_HOUSE,
        Action.LEAVE_HOUSE,
        Action.TRANSFER_HEADMASTER,
        Action.MANAGE_LOOT
    ],

    [Role.TEACHER]: [
        Action.CREATE_TASK,
        Action.EDIT_TASK,
        Action.DELETE_TASK,
        Action.VALIDATE_TASK,
        Action.INVITE_MEMBER,
        Action.REMOVE_MEMBER,
        Action.LEAVE_HOUSE,
        Action.CHANGE_ROLE,
        Action.MANAGE_LOOT
    ],

    [Role.STUDENT]: [
        Action.LEAVE_HOUSE,
        Action.CREATE_TASK
    ]
};

/**
 * @brief Checks whether a role is allowed to perform an action.
 * @param role (Role) Role to check.
 * @param action (Action) Action to verify.
 * @return true if the role can perform the action, false otherwise.
 */
export function can(role: Role, action: Action): boolean {
    return ROLE_ACTIONS[role].includes(action);
}

/**
 * @brief Checks whether a role can remove a member with the target role.
 * @param actor_role (Role) Role of the user performing the removal.
 * @param target_role (Role) Role of the member being removed.
 * @return true if the removal is allowed, false otherwise.
 */
export function canRemoveMember(
    actor_role: Role,
    target_role: Role
): boolean {
    if (target_role === Role.HEADMASTER)
        return false;

    if (actor_role === Role.HEADMASTER)
        return true;

    return actor_role === Role.TEACHER && target_role === Role.STUDENT;
}

/**
 * @brief Checks whether a user can edit a shared task.
 * @param actor_role (Role) Role of the user editing the task.
 * @param is_assigned (boolean) Whether the user is assigned to the task.
 * @param has_assignees (boolean) Whether the task has at least one assignee.
 * @return true if the user can edit the shared task, false otherwise.
 */
export function canEditSharedTask(
    actor_role: Role,
    is_assigned: boolean,
    has_assignees: boolean
): boolean {
    if (can(actor_role, Action.EDIT_TASK))
        return true;

    return actor_role === Role.STUDENT &&
        (is_assigned || !has_assignees);
}

/**
 * @brief Checks whether a user can validate a shared task.
 * @param actor_role (Role) Role of the user validating the task.
 * @param is_assigned (boolean) Whether the user is assigned to the task.
 * @param has_assignees (boolean) Whether the task has at least one assignee.
 * @return true if the user can validate the shared task, false otherwise.
 */
export function canValidateSharedTask(
    actor_role: Role,
    is_assigned: boolean,
    has_assignees: boolean
): boolean {
    if (can(actor_role, Action.VALIDATE_TASK))
        return true;

    return actor_role === Role.STUDENT &&
        (is_assigned || !has_assignees);
}

/**
 * @brief Checks whether a user can edit an individual monster loot.
 * @details A guardian (HEADMASTER/TEACHER) can edit any player's loot. A STUDENT can only edit their own.
 * @param actor_role (Role) Role of the user editing the loot.
 * @param actor_id (number) ID of the user editing the loot.
 * @param loot_owner_id (number) ID of the player the individual loot belongs to.
 * @return true if the user can edit this individual loot, false otherwise.
 */
export function canEditIndividualLoot(
    actor_role: Role,
    actor_id: number,
    loot_owner_id: number
): boolean {
    if (can(actor_role, Action.MANAGE_LOOT))
        return true;

    return actor_role === Role.STUDENT && actor_id === loot_owner_id;
}

/**
 * @brief Checks whether a user can transfer the HEADMASTER role.
 * @param actor_role (Role) Role of the user transferring the role.
 * @param actor_id (number) ID of the current user.
 * @param target_id (number) ID of the target member.
 * @return true if the HEADMASTER role can be transferred, false otherwise.
 */
export function canTransferHeadmaster(
    actor_role: Role,
    actor_id: number,
    target_id: number
): boolean {
    return can(actor_role, Action.TRANSFER_HEADMASTER)
        && actor_id !== target_id;
}