<script lang="ts">
    /**
     * @file FormDeleteMembers.svelte
     * @brief Confirmation modal for removing a household member or leaving the household.
     * @param open_form (boolean, bindable) Controls the modal's visibility.
     * @param formaction (string) The confirmation form's action (e.g. "?/leave", "?/removeMember").
     * @param [member_id] (number) Id of the member to remove; absent when the user is leaving the household themselves.
     * @param [form] ({ error?: string } | null | undefined) Error reported by the previous action.
     * @param [onSuccess] (() => void) Function called after a successful form submission.
     * @param [confirmation_message="Es-tu sûre de vouloir quitter le foyer ?"] (string) Confirmation message displayed in the modal.
     */
    import { LogOut, X } from "@lucide/svelte";
    import ButtonValidate2 from "../ButtonValidate2.svelte";
    import { enhance } from "$app/forms";

    let {
        open_form = $bindable(false),
        formaction,
        member_id,
        form = null,
        onSuccess,
        confirmation_message = "Es-tu sûre de vouloir quitter le foyer ?",
    }: {
        open_form: boolean;
        formaction: string;
        member_id?: number;
        form?: { error?: string } | null | undefined;
        onSuccess?: () => void;
        confirmation_message?: string;
    } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
        class="fixed inset-0 cursor-default bg-black/50"
        onclick={() => (open_form = false)}
        role="presentation"
    ></div>
    <div
        class="relative border rounded-xl border-yellow bg-beige w-full max-w-lg max-h-full flex flex-col overflow-hidden"
    >
        <div class="sticky top-0 bg-beige z-10">
            <div
                class="flex flex-row items-center justify-between bg-background-header p-4 rounded-t-xl"
            >
                <div class="flex flex-row items-center gap-2">
                    <LogOut
                        color="black"
                        class="p-[3px] bg-background-icon rounded-md"
                    />
                    <p class="text-white">Confirmation</p>
                </div>
                <X color="white" onclick={() => (open_form = false)} />
            </div>
        </div>

        <div class="p-4 overflow-y-auto">
            <p class="text-center">{confirmation_message}</p>
            <p class="text-center">⚠️​ Cette action est irréversible.</p>

            <form
                method="POST"
                class="space-y-5 mt-4"
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type === "success") {
                            open_form = false;
                            onSuccess?.();
                        }
                        await update();
                    };
                }}
            >
                {#if member_id !== undefined}
                    <input type="hidden" name="memberId" value={member_id} />
                {/if}
                <div class="flex flex-row justify-center gap-2 sm:gap-5 m-2">
                    <button
                        type="button"
                        class="border border-background-icon py-2 px-3 sm:py-4 sm:px-6 rounded-xl text-grey"
                        onclick={() => (open_form = false)}
                    >
                        Annuler
                    </button>
                    <ButtonValidate2 text="Confirmer" {formaction} />
                </div>
                {#if form?.error}
                    <p class="text-red text-center">{form.error}</p>
                {/if}
            </form>
        </div>
    </div>
</div>
