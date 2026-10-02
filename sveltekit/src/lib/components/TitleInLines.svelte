<script lang="ts">
	/**
	 * @file TitleInLines.svelte
	 * @brief A title surrounded by horizontal lines.
	 * @param title (string) The text that will be shown between the lines.
	 */

	let { title }: { title: string } = $props();
</script>

<div class="flex items-center mb-6 gap-4 px-1 md:mb-8 md:gap-6">
	<div class="line"></div>
	<p class="title">{title}</p>
	<div class="line"></div>
</div>
