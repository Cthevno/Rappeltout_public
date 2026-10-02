<script lang="ts">
    /**
     * @file MemberRoleCard.svelte
     * @brief Card displaying a household member and allowing management of their role and removal
     * @param member ({ id: number; username: string }) The household member (id and username)
     * @param formaction (string) The action of the member removal form.
     * @param [onSuccess] (function) Function called after a successful member removal (successful form submission).
     * @param [onTransferHeadmaster] (function) Function called when the HEADMASTER wants to transfer the household direction.
     */
    import { Trash2 } from "@lucide/svelte";
    import AvatarInitials from "./AvatarInitials.svelte";
    import FormDeleteMembers from "./FormDeleteMembers.svelte";
    import { Role } from "@prisma/client";
    import ChangeRoleForm from "./ChangeRoleForm.svelte";

    let {
        formaction,
        member,
        current_user,
        onTransferHeadmaster,
        onSuccess,
    }: {
        formaction: string;
        member: { id: number; username: string; role: Role };
        current_user: { id: number; role: Role };
        onTransferHeadmaster?: () => void;
        onSuccess?: () => void;
    } = $props();
    let open_form = $state(false);
    const can_remove_member = $derived(
        current_user.id !== member.id &&
            member.role !== Role.HEADMASTER &&
            (current_user.role === Role.HEADMASTER ||
                (current_user.role === Role.TEACHER &&
                    member.role === Role.STUDENT)),
    );
</script>

<div
    class="flex flex-row items-center justify-between gap-3 mt-5 mb-5 rounded-2xl border-2 border-background-icon bg-beige p-4 sm:mt-6 sm:mb-6 sm:p-5"
>
    <div class="flex min-w-0 items-center gap-5">
        <AvatarInitials username={member.username} />
        <div class="min-w-0">
            <p class="font-bold truncate">{member.username}</p>

            {#if member.role === Role.HEADMASTER}
                <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span
                        class="inline-block rounded-xl border border-background-icon bg-background-icon px-2 py-1 text-xs text-grey"
                    >
                        Directeur du foyer
                    </span>

                    {#if current_user.id === member.id && onTransferHeadmaster}
                        <button
                            type="button"
                            onclick={onTransferHeadmaster}
                            class="rounded-xl border border-background-icon bg-beige px-2 py-1 text-xs text-grey transition-colors hover:border-red hover:text-red"
                        >
                            Transférer la direction
                        </button>
                    {/if}
                </div>
            {:else if current_user.id === member.id || current_user.role === Role.STUDENT}
                <span
                    class="mt-1 inline-block rounded-xl border border-background-icon bg-beige px-2 py-1 text-xs text-grey"
                >
                    {member.role === Role.TEACHER ? "Professeur" : "Étudiant"}
                </span>
            {:else}
                <ChangeRoleForm
                    member_id={member.id}
                    role={member.role}
                    {onSuccess}
                />
            {/if}
        </div>
    </div>
    {#if can_remove_member}
        <button
            onclick={() => (open_form = true)}
            type="button"
            aria-label="Retirer ce membre"
            class="flex shrink-0 items-center justify-center rounded-xl border border-background-icon p-2 text-red bg-beige transition-colors hover:bg-red hover:text-white"
        >
            <Trash2 size={16} />
        </button>
    {/if}

    {#if open_form && can_remove_member}
        <FormDeleteMembers
            bind:open_form
            {formaction}
            member_id={member.id}
            {onSuccess}
            confirmation_message={`Es-tu sûre de vouloir retirer ${member.username} du foyer ?`}
        />
    {/if}
</div>
