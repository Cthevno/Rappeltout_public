<script lang="ts">
    /**
     * @file ButtonForgotPassword.svelte
     * @brief A navigation component for redirecting user to the forgot password page.
     * @param url (string) The destination path for the forgot password page.
     */
    let { url } = $props();
</script>

<a
    href={url}
    class="text-[#42150C] hover:text-[#B38C82] font-bold transition-colors"
    >Mot de passe oublié</a
>
