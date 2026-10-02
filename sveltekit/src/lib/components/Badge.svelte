<script lang="ts">
	/**
	 * @file Badge.svelte
	 * @brief A user badge.
	 * @param login (string) Name of the user. Its minimum length is 1.
	 * @param avatar (string) Optionnal, the user's avatar image.
	 * @param [color] (string) Optional, background color.
	 */

	let {
		login,
		avatar,
		color = "bg-background-beige",
	}: {
		login: string;
		avatar?: string;
		color?: string;
	} = $props();

	// Checks that the value of `login` is never empty, undefined or null.
	$effect(() => {
		if (!login) {
			throw new Error(
				"Badge component requires a non empty 'login' string.",
			);
		}
	});
</script>

<!-- Badge -->
<div
	class="ml-1 w-10 h-10 shrink-0 rounded-full {color} text-white border-1 border-golden flex items-center justify-center font-bold font-sans text-s"
>
	{#if avatar}
		<img
			src={avatar}
			alt={login}
			class="w-7 h-7"
		/>
	{:else}
		{login.substring(0, 2).toUpperCase()}
	{/if}
</div>
