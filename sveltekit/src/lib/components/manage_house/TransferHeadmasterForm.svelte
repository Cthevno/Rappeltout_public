<script lang="ts">
    /**
     * @file TransferHeadmasterForm.svelte
     * @brief Modal form for transferring the HEADMASTER role to another household member.
     * @param open_form (boolean, bindable) Controls the modal's visibility.
     * @param members ({ id: number; username: string }[]) Household members eligible to receive the HEADMASTER role.
     * @param [message="Choisis le membre à qui transférer la direction du foyer."] (string) Message displayed above the member selector.
     * @param [onSuccess] (function) Optional callback called after a successful transfer.
     */

    import { enhance } from "$app/forms";
    import { UserCog, X } from "@lucide/svelte";

    let {
        open_form = $bindable(false),
        members,
        message = "Choisis le membre à qui transférer la direction du foyer.",
        onSuccess,
    }: {
        open_form: boolean;
        members: { id: number; username: string }[];
        message?: string;
        onSuccess?: () => void;
    } = $props();

    let selected_member_id = $state("");
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
                    <UserCog
                        color="black"
                        class="p-[3px] bg-background-icon rounded-md"
                    />
                    <p class="text-white">Transférer la direction</p>
                </div>

                <X color="white" onclick={() => (open_form = false)} />
            </div>
        </div>

        <div class="p-4 overflow-y-auto">
            <p class="text-center">{message}</p>

            <form
                method="POST"
                action="?/transferHeadmaster"
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
                <select
                    name="memberId"
                    bind:value={selected_member_id}
                    required
                    class="w-full rounded-xl border border-background-icon bg-beige px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-red focus:border-red"
                >
                    <option value="" disabled> Choisir un membre </option>

                    {#each members as member}
                        <option value={member.id}>
                            {member.username}
                        </option>
                    {/each}
                </select>

                <div class="flex flex-row justify-center gap-2 sm:gap-5 m-2">
                    <button
                        type="button"
                        class="border border-background-icon py-2 px-3 sm:py-4 sm:px-6 rounded-xl text-grey"
                        onclick={() => (open_form = false)}
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        disabled={!selected_member_id}
                        class="py-2 px-3 sm:py-4 sm:px-6 rounded-xl bg-red text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Transférer
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
