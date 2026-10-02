<script lang="ts" generics="T">
    /**
     * @file PendingDeleteAction.svelte
     * @brief Cancel-deletion button + its deletion submission form
     * @param [formRef] (HTMLFormElement | undefined, bindable) Reference to the hidden deletion form
     * @param pending (T, bindable) Value pending deletion received from the parent (task id or flag)
     * @param resetValue (T) The value to reassign to `pending` after cancellation or submission
     * @param action (string) The form action's URL (e.g. "?/delete")
     * @param hasPendingDelete (boolean) Indicates whether a deletion is pending (displays the button and starts the timer)
     * @param [onSuccess] (function) Function called after the actual deletion (successful form submission).
     */

    import { enhance } from "$app/forms";

    let {
        formRef = $bindable(undefined),
        pending = $bindable(),
        resetValue,
        action,
        hasPendingDelete,
        onSuccess,
    }: {
        formRef: HTMLFormElement | undefined;
        pending: T;
        resetValue: T;
        action: string;
        hasPendingDelete: boolean;
        onSuccess?: () => void;
    } = $props();

    /**Sets the deletion delay to 2.5 seconds*/
    const DELETE_DELAY_MS = 2500;

    /**
     * If there is no pending deletion, does nothing.
     * Otherwise schedules the automatic form submission after DELETE_DELAY_MS.
     * If `pending` or `resetValue` changes before the deadline (cancellation, new target),
     * the current timer is cancelled via the cleanup before scheduling a new one.
     */
    $effect(() => {
        if (pending === resetValue) return;
        const timer = setTimeout(() => {
            formRef?.requestSubmit();
        }, DELETE_DELAY_MS);
        return () => clearTimeout(timer);
    });
</script>

{#if hasPendingDelete}
    <div class="flex justify-center m-5">
        <button
            onclick={() => (pending = resetValue)}
            class="flex items-center border border-grey rounded-xl py-2 px-3 text-black bg-beige hover:bg-red hover:text-white hover:border-red"
        >
            Annuler
        </button>
    </div>
    <form
        method="POST"
        {action}
        bind:this={formRef}
        use:enhance={() => {
            const submittedId = pending;
            return async ({ result, update }) => {
                await update();
                if (result.type === "success") onSuccess?.();
                if (pending === submittedId) pending = resetValue;
            };
        }}
        class="hidden"
    >
        <input type="hidden" name="id" value={pending} />
    </form>
{/if}
