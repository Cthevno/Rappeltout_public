<script lang="ts">
    /**
     * @file ButtonValidate.svelte
     * @brief A primary submission button component for forms.
     * This component renders a button with a 'submit' type, intended to trigger
     * form actions. It includes a reactive 'disabled' state to prevent
     * multiple submissions or invalid interactions.
     * @param text (string) The label displayed on the button.
     * @param [disabled=false] (boolean) If true, the button is non-interactive
     * and visually dimmed.
     */
    let { text, disabled = false }: { text: string; disabled?: boolean } =
        $props();
</script>

<button
    type="submit"
    class="btn-auth btn-auth-center btn-auth-border btn-auth-hover btn-auth-police
           disabled:opacity-50 disabled:cursor-not-allowed"
    {disabled}
>
    {text}
</button>
