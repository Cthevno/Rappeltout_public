<script lang="ts">
	/**
	 * @file ToggleSwitch.svelte
	 * @brief Styled toggle switch (red if active, grey otherwise).
	 * @param [checked] (boolean) Shared with the parent to read or modify the switch's state (true = active).
	 * @param name (string) Field name, used on the underlying `<input type="checkbox">` for form submission.
	 */

	let {
		checked = $bindable(false),
		name,
	}: { checked?: boolean; name: string } = $props();
</script>

<label class="relative inline-flex items-center cursor-pointer">
	<input {name} type="checkbox" bind:checked class="sr-only peer" />
	<div
		class="w-11 h-6 bg-background-icon-todo rounded-full peer-checked:bg-red transition-colors"
	></div>
	<div
		class="absolute left-1 top-1 w-4 h-4 bg-beige rounded-full transition-transform peer-checked:translate-x-5"
	></div>
</label>
