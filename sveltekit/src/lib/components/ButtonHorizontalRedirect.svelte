<script lang="ts">
	/**
	 * @file ButtonHorizontalRedirect.svelte
	 * @brief Horizontal redirect button
	 * @param title (string) The button's title
	 * @param subtitle (string) The button's subtitle
	 * @param Icon (Component) The icon to display
	 * @param url (string) The URL to redirect to
	 */
	import { ChevronRight } from "@lucide/svelte";
	import type { Component } from "svelte";

	let {
		title,
		subtitle,
		Icon,
		url,
	}: { title: string; subtitle: string; Icon: Component; url: string } =
		$props();
</script>

<a
	href={url}
	class="flex flex-row mt-5 mb-5 rounded-2xl border-2 border-background-icon bg-beige p-4 items-center transition duration-200 hover:scale-[1.02] hover:shadow-md sm:mt-6 sm:mb-6 sm:p-5"
>
	<div
		class="hidden sm:flex items-center justify-center rounded-xl bg-red p-5"
	>
		<Icon size={22} color="white" />
	</div>
	<div class="flex min-w-0 flex-1 flex-col text-left px-5">
		<p class="font-bold pb-2">{title}</p>
		<p class="text-grey">{subtitle}</p>
	</div>
	<ChevronRight size={28} class="shrink-0" />
</a>
