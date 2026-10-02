<script lang="ts">
    /**
     * @file ButtonReturn.svelte
     * @brief A navigation button to return to a previous or specific page.
     * @param url (string) The target destination path for the back action.
     */
    let { url }: { url: string } = $props();
</script>

<a
    href={url}
    class="flex items-center justify-center w-[89px] h-[53px]
           bg-btn-return btn-auth-border rounded-full
           btn-auth-police
           hover:bg-btn-hover transition-colors cursor-pointer"
>
    Retour
</a>
