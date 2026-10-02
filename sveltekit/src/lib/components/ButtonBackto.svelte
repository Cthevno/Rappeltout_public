<script lang="ts">
	/**
	 * @file ButtonBackto.svelte
	 * @brief Back button allowing navigation back to the home page or another page.
	 * @param url (string) The destination of the back link.
	 * @param text (string) The text displayed next to the arrow (hidden below sm).
	 */

	import { ArrowLeft } from "@lucide/svelte";
	let { url, text }: { url: string; text: string } = $props();
</script>

<div class="flex flex-row items-center">
	<a href={url} aria-label="Retour vers l'accueil">
		<ArrowLeft color="#fff" class="p-[15px] w-[3.5em] h-[3.5em]" />
	</a>
	<p class="text-white hidden sm:flex">{text}</p>
</div>
