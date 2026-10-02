<script lang="ts">
    /**
     * @file MsgError.svelte
     * @param [text] (string | null) The message error to print
     */
    let { text }: { text?: string | null } = $props();
</script>

<p class="msg-auth-error">{text}</p>
