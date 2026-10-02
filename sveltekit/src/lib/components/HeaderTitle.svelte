<script lang="ts">
	/**
	 * @file HeaderTitle.svelte
	 * @brief Displays the page title along with an icon.
	 * @param title (string) Displayed title text.
	 * @param Icon (Component) Svelte icon component displayed next to the title.
	 */

	import type { Component } from "svelte";

	let { title, Icon }: { title: string; Icon: Component } = $props();
</script>

<div class="flex flex-row items-center gap-1 sm:gap-3 p-2">
	<Icon color="black" class="p-[3px] bg-background-icon rounded-md" />
	<p class="text-white text-center">{title}</p>
</div>

