<script lang="ts">
    /**
     * @file SettingsCheck.svelte
     * @brief A green confirmation message inside a green box.
     * @param text (string) The message
     */
    import { CircleCheck } from "@lucide/svelte";

    let { text }: { text: string } = $props();
</script>

<div
    class="bg-settings-bg-check border-settings-border-check flex items-center gap-3 rounded-xl border-2 px-4 py-3 max-w-[800px] mx-auto"
>
    <CircleCheck size={16} class="text-settings-text-check" />
    <p class="text-settings-text-check text-sm">{text}</p>
</div>
