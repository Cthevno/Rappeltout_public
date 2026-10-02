<script lang="ts">
    /**
     * @file DangerZoneCard.svelte
     * @brief "Danger zone" card with the button to delete the household
     * @param formaction (string) The household deletion form's action, passed to FormDeleteMembers.
     * @param current_user ({ id: number; role: Role }) Current authenticated user.
     * @param member_count (number) Number of members in the household.
     * @param form ({ error?: string } | null | undefined) Error reported by the deletion action, passed to FormDeleteMembers.
     */
    import { LogOut } from "@lucide/svelte";
    import FormDeleteMembers from "./FormDeleteMembers.svelte";
    import { Role } from "@prisma/client";
    import { enhance } from "$app/forms";

    let {
        formaction,
        current_user,
        member_count,
        form,
    }: {
        formaction: string;
        current_user: { id: number; role: Role };
        member_count: number;
        form: { error?: string } | null | undefined;
    } = $props();
    let open_form = $state(false);
    let leave_error: string | null = $state(null);
</script>

<div
    class="flex flex-col bg-beige items-center gap-3 border-2 border-dashed border-red rounded-xl mt-5 mb-5 p-4 sm:p-5"
>
    <p class="text-red text-center">
        Ces actions sont irréversibles. Procède avec précaution.
    </p>
    <div class="flex flex-row gap-2 items-center">
        {#if current_user.role !== Role.HEADMASTER || member_count > 1}
            <form
                method="POST"
                action="?/leaveHouse"
                use:enhance={() => {
                    leave_error = null;

                    return async ({ result, update }) => {
                        if (result.type === "failure") {
                            const error = result.data?.error;

                            leave_error =
                                typeof error === "string"
                                    ? error
                                    : "Impossible de quitter le foyer";
                        }

                        await update();
                    };
                }}
            >
                <button
                    type="submit"
                    class="flex flex-row gap-2 p-2 bg-red rounded-xl text-white hover:opacity-80"
                >
                    <LogOut /> Quitter le foyer
                </button>
            </form>
        {/if}
        {#if current_user.role === Role.HEADMASTER}
            <button
                onclick={() => (open_form = true)}
                class="flex flex-row gap-2 p-2 bg-red rounded-xl text-white hover:opacity-80"
            >
                <LogOut /> Supprimer le foyer
            </button>
        {/if}
    </div>
    {#if leave_error}
        <p class="text-sm text-red text-center">
            {leave_error}
        </p>
    {/if}
    {#if open_form && current_user.role === Role.HEADMASTER}
        <FormDeleteMembers
            bind:open_form
            {formaction}
            {form}
            confirmation_message="Es-tu sûre de vouloir supprimer le foyer ?"
        />
    {/if}
</div>
