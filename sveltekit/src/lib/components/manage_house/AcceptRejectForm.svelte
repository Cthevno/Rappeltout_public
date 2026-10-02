<script lang="ts">
    /**
     * @file AcceptRejectForm.svelte
     * @brief Form for accepting/rejecting a pending membership request
     * @param pending_id (number) The id of the pending request to process
     * @param [onSuccess] (function) Function called after a successful accept/reject (successful form submission).
     */

    import { enhance } from "$app/forms";
    import ButtonAction from "../ButtonAction.svelte";
    import { UserRoundPlus, UserRoundX } from "@lucide/svelte";
    let {
        pending_id,
        onSuccess,
    }: { pending_id: number; onSuccess?: () => void } = $props();
</script>

<form
    method="POST"
    class="flex shrink-0 gap-2"
    use:enhance={() => {
        return async ({ result, update }) => {
            if (result.type === "success") {
                onSuccess?.();
            }
            await update();
        };
    }}
>
    <input type="hidden" name="pendingId" value={pending_id} />
    <ButtonAction
        formaction="?/accept"
        Icon={UserRoundPlus}
        color="bg-green-700 text-white transition hover:bg-green-800"
        text="Accepter"
    />
    <ButtonAction
        formaction="?/reject"
        Icon={UserRoundX}
        color=" bg-red text-white transition hover:opacity-90"
        text="Refuser"
    />
</form>
