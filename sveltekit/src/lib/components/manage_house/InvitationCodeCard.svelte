<script lang="ts">
    /**
     * @file InvitationCodeCard.svelte
     * @brief Card that displays the code and allows copying or regenerating it
     * @param code (string) The current code
     * @param [onSuccess] (function) Function called after a successful code regeneration (successful form submission).
     */
    import Code from "../Code.svelte";
    import { Check, Copy, RefreshCw } from "@lucide/svelte";
    import { enhance } from "$app/forms";
    import { Role } from "@prisma/client";

    let {
        code,
        current_user,
        onSuccess,
    }: {
        code: string;
        current_user: { id: number; role: Role };
        onSuccess?: () => void;
    } = $props();

    /**Boolean used to know whether the household's code should be changed*/
    let change_code: boolean = $state(false);

    /**Boolean used to know whether a copy has been made*/
    let copy: boolean = $state(false);

    /**
     * @brief Copies the code
     * @details 1. Copies the code to the clipboard
     *          2. Sets the boolean to true to signal that the copy has been made and update the UI
     *          3. Timer that reverts the button from "Copié" to "Copier" after 1.5s
     */
    function copyCode() {
        navigator.clipboard
            .writeText(code)
            .then(() => {
                copy = true;
                setTimeout(() => {
                    copy = false;
                }, 1500);
            })
            .catch(() => {});
    }
</script>

<div
    class="mt-5 mb-5 rounded-2xl border-2 border-background-icon bg-beige p-4 sm:mt-6 sm:p-5"
>
    <div class="flex flex-col items-start gap-3">
        <p class="text-sm font-semibold leading-relaxed text-grey sm:text-base">
            Partage ce code pour qu'un nouveau membre puisse faire une demande
            d'adhésion.
        </p>
        <div
            class="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
            <Code {code} text_color="text-black" fill />
            <div class="flex flex-col gap-2 sm:w-auto">
                {#if copy}
                    <div
                        class="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-background-icon bg-dark-beige px-4 py-2 font-bold text-black sm:w-auto"
                    >
                        <Check size={18} color={"green"} />
                        Copié
                    </div>
                {:else}
                    <button
                        type="button"
                        onclick={() => copyCode()}
                        class="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-background-icon bg-dark-beige px-4 py-2 font-bold text-black transition hover:bg-red hover:text-white hover:border-red sm:w-auto"
                    >
                        <Copy size={18} />
                        Copier
                    </button>
                {/if}
                {#if current_user.role === Role.HEADMASTER}
                    <form
                        method="POST"
                        use:enhance={() => {
                            return async ({ result, update }) => {
                                if (result.type === "success") {
                                    change_code = false;
                                    onSuccess?.();
                                }
                                await update();
                            };
                        }}
                    >
                        <button
                            formaction="?/regenerateCode"
                            type="submit"
                            class="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-background-icon bg-dark-beige px-4 py-2 font-bold text-black transition hover:bg-red hover:text-white hover:border-red sm:w-auto"
                            onclick={() => (change_code = true)}
                        >
                            <RefreshCw size={18} />
                            Regénérer
                        </button>
                    </form>
                {/if}
            </div>
        </div>
    </div>
</div>
