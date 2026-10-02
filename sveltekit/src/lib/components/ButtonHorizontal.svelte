<script lang="ts">
	/**
	 * @file ButtonHorizontal.svelte
	 * @brief A clickable horizontal button with member information.
	 * @param href (string) Link to the corresponding page.
	 * @param login (string) Login of the user to display.
	 * @param role (string)	Role of the user to display.
	 * @param stats (string) Open string field to display the stats
	 * of the user to display.
	 */

	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Badge from "$lib/components/Badge.svelte";

	let {
		href,
		login,
		avatar,
		role,
		stats,
	}: {
		href: string;
		login: string;
		avatar?: string;
		role?: string;
		stats: string;
	} = $props();
</script>

<a
	{href}
	class={"flex flex-row h-full items-center gap-3 justify-start min-h-14 rounded-2xl border-2 p-2 transition hover:scale-[1.01] hover:shadow-md border-background-icon bg-beige text-black"}
>
	<!-- Member badge -->
	<Badge {login} {avatar}/>
	<div class="flex flex-col h-full justify-evenly flex-1 min-w-0">
		<div class="flex flex-row items-center gap-3 min-w-0 @container">
			<!-- Member name. -->
			<div
				class="font-semibold whitespace-nowrap overflow-hidden min-w-0 @max-[140px]:truncate"
			>
				{login}
			</div>
			<!-- Member role in the house. -->
			{#if role}
				<div
					class="bg-dull-gold rounded-full px-2 py-0.3 whitespace-nowrap shrink-[100] min-w-0 overflow-hidden @max-[140px]:hidden"
				>
					{role.toUpperCase()}
				</div>
			{/if}
		</div>
		<div class="min-w-0">
			<!-- Member stats. -->
			<p class="truncate">{stats}</p>
		</div>
	</div>
	<!-- Arrow symbol. -->
	<ChevronRight class="text-grey w-4 h-4 stroke-[2.2] mr-2 shrink-0" />
</a>
