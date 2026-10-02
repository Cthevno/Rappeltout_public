/**
 * @brief Builds the field configuration objects consumed by FormField.svelte (via Form.svelte).
 * @details Each function takes the task currently being edited (undefined in creation mode) and pre-fills
 * `value`/`stateDefault` with its current value, so the form opens already filled in when editing.
 * Each function only depends on the field(s) it actually uses (not a full Task type),
 * to stay reusable with any object carrying that field (todo or household_chores).
 */

/** Task carrying the "nameTask" field, for nameField(). */
type NameFieldTask = { nameTask: string };

/**
 * @brief Builds the task name text field.
 * @param task (NameFieldTask | undefined) The task currently being edited, or undefined when creating.
 * @returns The "task" field config, pre-filled with task.nameTask if provided.
 */
export function nameField(task?: NameFieldTask) {
    const nameField =
        {
            label: "Nom de la tâche*",
            type: "text",
            name: "task",
            placeholder: "Ex: remplir la déclaration d'impôt",
            value: task?.nameTask,
        } as const;
    return (nameField);
}

/** Task carrying the "category" field, for categoryField(). */
type CategoryFieldTask = { category: string };

/**
 * @brief Builds the "Category" filter field (single choice among the household's categories).
 * @param task (CategoryFieldTask | undefined) The task currently being edited, or undefined when creating.
 * @returns The "category" field config, with task's category checked by default if provided.
 */
export function categoryField(task?: CategoryFieldTask) {
    const category = ([
        {
            label: "Etudes",
            value: "STUDIES",
            stateDefault: task ? task.category == "STUDIES" : false,
        },
        {
            label: "Sport",
            value: "SPORT",
            stateDefault: task ? task.category == "SPORT" : false,
        },
        {
            label: "Démarches",
            value: "ADMINISTRATIVE",
            stateDefault: task ? task.category == "ADMINISTRATIVE" : false,
        },
        {
            label: "Santé",
            value: "HEALTH",
            stateDefault: task ? task.category == "HEALTH" : false,
        },
        {
            label: "Perso",
            value: "PERSONAL",
            stateDefault: task ? task.category == "PERSONAL" : false,
        },
        {
            label: "Autre",
            value: "OTHER",
            stateDefault: task ? task.category == "OTHER" : false,
        },
    ]);

    const categoryField =
        {
            label: "Catégorie*",
            type: "filter",
            name: "category",
            filters: category,
        } as const;
    return (categoryField);
}

/** Task carrying the "endedAt" field, for dateField(). */
type DateFieldTask = { endedAt: Date | null };

/**
 * @brief Builds the deadline date field.
 * @param task (DateFieldTask | undefined) The task currently being edited, or undefined when creating.
 * @returns The "date" field config, pre-filled with task.endedAt (converted to "yyyy-mm-dd") if provided.
 */
export function dateField(task?: DateFieldTask) {
    function converts_dates_to_strings(
        date: Date | string | null | undefined,
    ): string {
        if (!date) return "";
        return new Date(date).toISOString().slice(0, 10);
    }

    const dateField = {
        label: "Date limite",
        type: "date",
        name: "date",
        value: converts_dates_to_strings(task?.endedAt),
    } as const
    return (dateField);
}

/** Task carrying the "difficulty" field, for difficultyField(). */
type DifficultyFieldTask = { difficulty: string };

/**
 * @brief Builds the "Difficulty" filter field (single choice, with the earned XP as a sublabel).
 * @param task (DifficultyFieldTask | undefined) The task currently being edited, or undefined when creating.
 * @returns The "difficulty" field config, with task's difficulty checked by default if provided.
 */
export function difficultyField(task?: DifficultyFieldTask) {
    const difficulty = ([
        {
            label: "Super facile",
            sublabel: "5 XP",
            value: "SUPER_EASY",
            stateDefault: task ? task.difficulty == "SUPER_EASY" : false,
        },
        {
            label: "Facile",
            sublabel: "10 XP",
            value: "EASY",
            stateDefault: task ? task.difficulty == "EASY" : false,
        },
        {
            label: "Moyen",
            sublabel: "15 XP",
            value: "MEDIUM",
            stateDefault: task ? task.difficulty == "MEDIUM" : false,
        },
        {
            label: "Difficile",
            sublabel: "20 XP",
            value: "DIFFICULT",
            stateDefault: task ? task.difficulty == "DIFFICULT" : false,
        },
    ]);

    const difficultyField = {
        label: "Difficulté et XP *",
        type: "filter",
        name: "difficulty",
        filters: difficulty,
    } as const
    return (difficultyField);
}

/** Household member as returned by household_chores' load() (id + username only). */
type HouseholdMember = { id: number; username: string };

/** Task carrying the "assignees" field, for memberFields(). */
type MemberFieldsTask = { assignees?: { id: number }[] };

/**
 * @brief Builds the "Assigned to" filter field (multiple choice among the household's members).
 * @param members (HouseholdMember[]) The household's members, fetched by the page's load() (no request here).
 * @param task (MemberFieldsTask | undefined) The task currently being edited, or undefined when creating.
 * @returns The "assignee" field config, with task.assignees' members checked by default if provided.
 */
export function memberFields(members: HouseholdMember[], task?: MemberFieldsTask) {
    const filters = members.map((member) => ({
        label: member.username,
        value: String(member.id),
        stateDefault: task?.assignees?.some((a) => a.id === member.id) ?? false,
    }));

    const memberFields = {
        label: "Assignée à (plusieurs possibles) *",
        type: "filter",
        name: "assignee",
        filters,
        multiple: true,
    } as const
    return (memberFields);
}

