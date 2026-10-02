<script lang="ts">
    /**
     * @file PendingInvitationCard.svelte
     * @brief Card handling pending invitations
     * @param pending ({ id: number; email: string }) The person whose invitation is pending
     */

    import AvatarInitials from "./AvatarInitials.svelte";
    import { enhance } from "$app/forms";
    import { Role } from "@prisma/client";
    import { Trash2 } from "@lucide/svelte";

    let {
        pending,
        current_user,
        onSuccess,
    }: {
        pending: { id: number; email: string };
        current_user: { id: number; role: Role };
        onSuccess?: () => void;
    } = $props();
</script>

<div
    class="flex items-center justify-between gap-3 rounded-2xl border-2 border-background-icon bg-beige p-4"
>
    <div class="flex min-w-0 items-center gap-3">
        <AvatarInitials username={pending.email} />
        <div class="min-w-0">
            <p class="font-bold">{pending.email}</p>
            <div class="flex items-center gap-1 text-sm text-grey">
                <p>Le hibou est en route... (invitation en attente)</p>
            </div>
        </div>
    </div>
    {#if current_user.role !== Role.STUDENT}
        <div class="flex items-center gap-4 shrink-0">
            <form
                method="POST"
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type === "success") {
                            onSuccess?.();
                        }
                        await update();
                    };
                }}
            >
                <input type="hidden" name="invitationId" value={pending.id} />
                <button
                    type="submit"
                    formaction="?/sendInvitation"
                    aria-label="Renvoyer le hibou"
                    class="underline underline-offset-2 transition hover:text-red"
                >
                    Renvoyer le hibou
                </button>
            </form>

            <form
                method="POST"
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type === "success") {
                            onSuccess?.();
                        }
                        await update();
                    };
                }}
            >
                <input type="hidden" name="invitationId" value={pending.id} />
                <button
                    type="submit"
                    formaction="?/deleteInvitation"
                    aria-label="Annuler l'invitation"
                    class="p-1 text-grey transition hover:text-red"
                >
                    <Trash2 class="w-[1.2em] h-[1.2em]" />
                </button>
            </form>
        </div>
    {/if}
</div>
