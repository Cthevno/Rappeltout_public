<script lang="ts">
    /**
     * @file HouseIdentityCard.svelte
     * @brief Card displaying and allowing renaming of the household's name
     * @param house_name (string) The household's current name
     * @param [onSuccess] (function) Function called after a successful rename (successful form submission).
     */
    import ButtonValidate2 from "../ButtonValidate2.svelte";
    import { enhance } from "$app/forms";
    import { Role } from "@prisma/client";

    const MAX_HOUSE_NAME_LENGTH = 60;

    let {
        house_name,
        current_user,
        onSuccess,
    }: {
        house_name: string;
        current_user: { id: number; role: Role };
        onSuccess?: () => void;
    } = $props();

    /**Variable used to know whether the household should be renamed*/
    let change_name: boolean = $state(false);

    /** Local variable of the rename field, initialized to the actual house name */
    let new_house_name: string = $state("");
    $effect(() => {
        new_house_name = house_name;
    });
    let trimmedName = $derived(new_house_name.trim());
    let nameError = $derived.by(() => {
        if (trimmedName === "") return "Le nom du foyer ne peut pas être vide";
        if (new_house_name.length > MAX_HOUSE_NAME_LENGTH)
            return `Le nom du foyer ne peut pas dépasser ${MAX_HOUSE_NAME_LENGTH} caractères`;
        return null;
    });
    let isNameValid = $derived(nameError === null);
</script>

<div
    class="flex flex-col mt-5 mb-5 rounded-2xl border-2 border-background-icon bg-beige p-4 sm:mt-6 sm:mb-6 sm:p-5"
>
    <p class="text-grey">Nom du foyer</p>
    <div class="mt-1 flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        {#if !change_name}
            <p class="min-w-0 max-w-full font-bold break-words">
                Foyer <span class="text-red [overflow-wrap:anywhere]"
                    >{house_name}</span
                >
            </p>
            {#if current_user.role === Role.HEADMASTER}
                <button
                    type="button"
                    onclick={() => (change_name = true)}
                    aria-label="Renommer le foyer"
                    class="shrink-0 underline underline-offset-2 transition hover:text-red"
                >
                    Renommer
                </button>
            {/if}
        {:else if current_user.role === Role.HEADMASTER}
            <form
                method="POST"
                class="flex flex-col gap-2 w-full"
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type === "success") {
                            change_name = false;
                            onSuccess?.();
                        }
                        await update();
                    };
                }}
            >
                <div class="flex flex-row items-center gap-2 w-full">
                    <input
                        type="text"
                        name="houseName"
                        required
                        maxlength={MAX_HOUSE_NAME_LENGTH}
                        bind:value={new_house_name}
                        aria-invalid={nameError !== null}
                        class="flex-1 min-w-0 text-grey border rounded-xl px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red focus:border-red {nameError
                            ? 'border-red'
                            : 'border-background-icon'}"
                    />
                    <div class="shrink-0">
                        <ButtonValidate2
                            text="OK"
                            formaction="?/renameHouse"
                            disabled={!isNameValid}
                        />
                    </div>
                </div>
                {#if nameError}
                    <p class="text-red text-xs" role="alert">{nameError}</p>
                {/if}
            </form>
        {/if}
    </div>
</div>
