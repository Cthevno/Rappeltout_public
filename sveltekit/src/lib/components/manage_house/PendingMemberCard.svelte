<script lang="ts">
    /**
     * @file PendingMemberCard.svelte
     * @brief Card displaying a member pending household membership (avatar, name, actions)
     * @param pending ({ id: number; username: string }) The pending request to display
     * @param [onSuccess] (function) Function called after a successful accept/reject, passed to AcceptRejectForm.
     */

    import { Clock } from "@lucide/svelte";
    import AcceptRejectForm from "./AcceptRejectForm.svelte";
    import AvatarInitials from "./AvatarInitials.svelte";
    import { Role } from "@prisma/client";

    let {
        pending,
        current_user,
        onSuccess,
    }: {
        pending: { id: number; username: string };
        current_user: { id: number; role: Role };
        onSuccess?: () => void;
    } = $props();
</script>

<div
    class="flex items-center justify-between gap-3 rounded-2xl border-2 border-background-icon bg-beige p-4"
>
    <div class="flex min-w-0 items-center gap-3">
        <AvatarInitials username={pending.username} />
        <div class="min-w-0">
            <p class="font-bold">{pending.username}</p>
            <div class="flex items-center gap-1 text-sm text-grey">
                <Clock size={14} class="shrink-0" />
                <p>Souhaite rejoindre le foyer</p>
            </div>
        </div>
    </div>
    {#if current_user.role !== Role.STUDENT}
        <AcceptRejectForm pending_id={pending.id} {onSuccess} />
    {/if}
</div>
