import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { Action, can, canRemoveMember, canEditSharedTask, canValidateSharedTask, canTransferHeadmaster, canEditIndividualLoot } from "./permissions";

/**
 * @file permissions.test.ts
 * @brief Tests role-based permission checks.
 */

describe("can", () => {
    it("allows HEADMASTER to perform every action", () => {
        for (const action of Object.values(Action)) {
            expect(can(Role.HEADMASTER, action)).toBe(true);
        }
    });

    it("does not allow STUDENT to delete tasks", () => {
        expect(can(Role.STUDENT, Action.DELETE_TASK)).toBe(false);
    });

    it("allows TEACHER to create tasks", () => {
        expect(can(Role.TEACHER, Action.CREATE_TASK)).toBe(true);
    });

    it("allows TEACHER to change roles", () => {
        expect(can(Role.TEACHER, Action.CHANGE_ROLE)).toBe(true);
    });

    it("allows STUDENT to create tasks", () => {
        expect(can(Role.STUDENT, Action.CREATE_TASK)).toBe(true);
    });

    it("allows TEACHER to manage the monster loot", () => {
        expect(can(Role.TEACHER, Action.MANAGE_LOOT)).toBe(true);
    });

    it("does not allow STUDENT to manage the monster loot", () => {
        expect(can(Role.STUDENT, Action.MANAGE_LOOT)).toBe(false);
    });
});

describe("canRemoveMember", () => {
    it("allows HEADMASTER to remove a TEACHER", () => {
        expect(
            canRemoveMember(Role.HEADMASTER, Role.TEACHER)
        ).toBe(true);
    });

    it("allows HEADMASTER to remove a STUDENT", () => {
        expect(
            canRemoveMember(Role.HEADMASTER, Role.STUDENT)
        ).toBe(true);
    });

    it("does not allow HEADMASTER removal", () => {
        expect(
            canRemoveMember(Role.HEADMASTER, Role.HEADMASTER)
        ).toBe(false);
    });

    it("allows TEACHER to remove a STUDENT", () => {
        expect(
            canRemoveMember(Role.TEACHER, Role.STUDENT)
        ).toBe(true);
    });

    it("does not allow TEACHER to remove another TEACHER", () => {
        expect(
            canRemoveMember(Role.TEACHER, Role.TEACHER)
        ).toBe(false);
    });

    it("does not allow TEACHER to remove HEADMASTER", () => {
        expect(
            canRemoveMember(Role.TEACHER, Role.HEADMASTER)
        ).toBe(false);
    });
});

describe("canEditSharedTask", () => {
    it("allows HEADMASTER to edit a shared task", () => {
        expect(
            canEditSharedTask(Role.HEADMASTER, false, true)
        ).toBe(true);
    });

    it("allows TEACHER to edit a shared task", () => {
        expect(
            canEditSharedTask(Role.TEACHER, false, true)
        ).toBe(true);
    });

    it("allows STUDENT to edit an assigned shared task", () => {
        expect(
            canEditSharedTask(Role.STUDENT, true, true)
        ).toBe(true);
    });

    it("allows STUDENT to edit an unassigned shared task", () => {
        expect(
            canEditSharedTask(Role.STUDENT, false, false)
        ).toBe(true);
    });

    it("refuses STUDENT editing when the task is assigned only to other members", () => {
        expect(
            canEditSharedTask(Role.STUDENT, false, true)
        ).toBe(false);
    });
});

describe("canValidateSharedTask", () => {
    it("allows HEADMASTER to validate a shared task", () => {
        expect(
            canValidateSharedTask(Role.HEADMASTER, false, true)
        ).toBe(true);
    });

    it("allows TEACHER to validate a shared task", () => {
        expect(
            canValidateSharedTask(Role.TEACHER, false, true)
        ).toBe(true);
    });

    it("allows STUDENT to validate an assigned shared task", () => {
        expect(
            canValidateSharedTask(Role.STUDENT, true, true)
        ).toBe(true);
    });

    it("allows STUDENT to validate an unassigned shared task", () => {
        expect(
            canValidateSharedTask(Role.STUDENT, false, false)
        ).toBe(true);
    });

    it("refuses STUDENT validation when the task is assigned only to other members", () => {
        expect(
            canValidateSharedTask(Role.STUDENT, false, true)
        ).toBe(false);
    });
});

describe("canEditIndividualLoot", () => {
    it("allows HEADMASTER to edit any player's loot", () => {
        expect(
            canEditIndividualLoot(Role.HEADMASTER, 1, 2)
        ).toBe(true);
    });

    it("allows TEACHER to edit any player's loot", () => {
        expect(
            canEditIndividualLoot(Role.TEACHER, 1, 2)
        ).toBe(true);
    });

    it("allows STUDENT to edit their own loot", () => {
        expect(
            canEditIndividualLoot(Role.STUDENT, 1, 1)
        ).toBe(true);
    });

    it("does not allow STUDENT to edit another player's loot", () => {
        expect(
            canEditIndividualLoot(Role.STUDENT, 1, 2)
        ).toBe(false);
    });
});

describe("canTransferHeadmaster", () => {
    it("allows HEADMASTER to transfer the role to another member", () => {
        expect(
            canTransferHeadmaster(Role.HEADMASTER, 1, 2)
        ).toBe(true);
    });

    it("does not allow HEADMASTER to transfer the role to themselves", () => {
        expect(
            canTransferHeadmaster(Role.HEADMASTER, 1, 1)
        ).toBe(false);
    });

    it("does not allow TEACHER to transfer the HEADMASTER role", () => {
        expect(
            canTransferHeadmaster(Role.TEACHER, 1, 2)
        ).toBe(false);
    });

    it("does not allow STUDENT to transfer the HEADMASTER role", () => {
        expect(
            canTransferHeadmaster(Role.STUDENT, 1, 2)
        ).toBe(false);
    });
});