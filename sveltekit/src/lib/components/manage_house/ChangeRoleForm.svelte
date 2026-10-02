<script lang="ts">
    /**
     * @file ChangeRoleForm.svelte
     * @brief Form for changing a household member's role.
     * @param member_id (number) ID of the member whose role is changed.
     * @param role (Role) Current role of the member.
     * @param onSuccess (function) Optional callback called after a successful role change.
     */

    import { enhance } from "$app/forms";
    import { Role } from "@prisma/client";

    let {
        member_id,
        role,
        onSuccess,
    }: {
        member_id: number;
        role: Role;
        onSuccess?: () => void;
    } = $props();
</script>

<form
    method="POST"
    action="?/changeRole"
    use:enhance={() => {
        return async ({ result, update }) => {
            if (result.type === "success") {
                onSuccess?.();
            }
            await update();
        };
    }}
>
    <input type="hidden" name="memberId" value={member_id} />
    <select
        name="role"
        value={role}
        onchange={(event) => event.currentTarget.form?.requestSubmit()}
        class="mt-1 rounded-xl border border-background-icon bg-beige px-2 py-1 text-sm text-grey transition-colors focus:outline-none focus:ring-2 focus:ring-red focus:border-red"
    >
        <option value={Role.STUDENT}>Etudiant</option>
        <option value={Role.TEACHER}>Professeur</option>
    </select>
</form>
