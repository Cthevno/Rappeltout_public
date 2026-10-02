<script lang="ts">
    /**
     * @file CollectiveLootEditor.svelte
     * @brief Component that manage what is printed on the collective loot.
     * @details A guardian will be able to modifye the loots
     * @param collectiveLoot (string, bindable) The string representing the collective loot, bound to the input value.
     * @param monsterId (number) The unique identifier of the monster associated with the loot.
     * @param isGardien (boolean) Boolean indicating whether the current user has guardian privileges to modify the loot.
     * @param onUnauthorizedAttempt (function) Callback function triggered when a non-guardian attempts to interact with the input.
     */

    import { Pencil, Check } from "@lucide/svelte";
    import { enhance } from "$app/forms";

    const MAX_LOOT_LENGTH = 60;

    let {
        collectiveLoot = $bindable(),
        monsterId,
        isGardien,
        onUnauthorizedAttempt,
    }: {
        collectiveLoot: string;
        monsterId: number;
        isGardien: boolean;
        onUnauthorizedAttempt: () => void;
    } = $props();

    /**
     * @brief Handles click events on the collective loot input field.
     * @details Checks whether the current user has guardian privileges (`isGardien`).
     *          If the user is not a guardian, it triggers the `onUnauthorizedAttempt` callback.
     *          HEADMASTER and TEACHER are the only roles considered as guardian.
     *          STUDENT is not considered as guardian.
     * @return (void)
     */
    function handleInputClick() {
        if (!isGardien) {
            onUnauthorizedAttempt();
        }
    }

    let tooLong = $derived(collectiveLoot.length > MAX_LOOT_LENGTH);
</script>

<form
    method="POST"
    action="?/updateCollectiveLoot"
    use:enhance
    class="flex flex-col gap-2 mt-3"
>
    <input type="hidden" name="monsterId" value={monsterId} />

    <div
        class="relative flex items-center border rounded-xl px-4 py-2.5 shadow-sm {tooLong
            ? 'border-red-500'
            : 'border-golden/50'} {isGardien
            ? 'bg-white'
            : 'bg-background-beige opacity-60 cursor-not-allowed'}"
    >
        <input
            type="text"
            name="collectiveLoot"
            bind:value={collectiveLoot}
            readonly={!isGardien}
            aria-invalid={tooLong}
            onclick={handleInputClick}
            class="w-full bg-transparent font-serif text-dark-brown focus:outline-none text-sm pr-8 {isGardien
                ? 'cursor-text'
                : 'cursor-not-allowed'}"
        />

        <div class="absolute right-3 text-golden">
            {#if isGardien}
                <Check size={16} class="text-green-600" />
            {:else}
                <Pencil size={15} class="opacity-50" />
            {/if}
        </div>
    </div>

    {#if tooLong}
        <p class="text-xs text-red" role="alert">
            {collectiveLoot.length}/{MAX_LOOT_LENGTH} caractères — le butin est trop
            long.
        </p>
    {/if}

    {#if isGardien}
        <div class="flex justify-end">
            <button
                type="submit"
                disabled={tooLong}
                class="flex items-center gap-1.5 bg-background-red hover:bg-background-red/90 text-white font-serif font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check size={14} />
                Enregistrer le butin
            </button>
        </div>
    {/if}
</form>
