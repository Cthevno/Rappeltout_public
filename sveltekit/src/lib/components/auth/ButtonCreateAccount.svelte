<script lang="ts">
    /**
     * @file ButtonCreateAccount.svelte
     * @brief A navigation component for redirecting users to the craate account page.
     * @param url (string) The destination path for the registration page.
     */
    let { url }: { url: string } = $props();
</script>

<a
    href={url}
    class="text-text-already hover:text-text-hover-already font-bold transition-colors"
    >Créer un compte</a
>
