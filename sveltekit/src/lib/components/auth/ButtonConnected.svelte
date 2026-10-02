<script lang="ts">
    /**
     * @file ButtonConnected.svelte
     * @brief A navigation component for redirecting users to the login page.
     * @param url (string) The destination path for the login page.
     */
    let { url }: { url: string } = $props();
</script>

<div class="flex flex-row justify-center gap-2 btn-auth-police">
    <p class="text-black font-normal">Déjà un compte ?</p>
    <a
        href={url}
        class="text-text-already hover:text-text-hover-already hover:font-bold"
        >Se connecter</a
    >
</div>
