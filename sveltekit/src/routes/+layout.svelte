<script lang="ts">
	/**
	 * @file +layout.svelte
	 * @brief Root layout shared by every application page.
	 *
	 * @details
	 * Imports the global stylesheet and applies the visual
	 * house theme provided by the server for the current user.
	 */

	import "../app.css";

	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/state";
	import { onMount } from "svelte";
    import { io } from "socket.io-client";
    import { invalidateAll } from "$app/navigation";

	import {
		apply_house_theme,
		DEFAULT_HOUSE_THEME,
		is_house_theme,
		type HouseTheme,
	} from "$lib/theme";

	let { data, children } = $props();

	/**
	 * @brief Applies the visual theme received from the server.
	 *
	 * @details
	 * The effect runs whenever data.theme changes.
	 * This is important when a user logs out and another user
	 * logs in without the root layout being recreated.
	 *
	 * If the server value is invalid, Parchemin is used
	 * as the default theme.
	 */
	$effect(() => {
		const theme: HouseTheme = is_house_theme(data.theme)
			? (data.theme as HouseTheme)
			: DEFAULT_HOUSE_THEME;

		apply_house_theme(theme);
	});

	onMount(() => {
		const socket = io();
		socket.on("notificationsUpdated", async () => {
            await invalidateAll();
        });

		return () => {
            socket.disconnect();
        };
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<title>{page.data.seo?.title ?? "Rappeltout"}</title>

	<meta
		name="description"
		content={page.data.seo?.description ??
			"Mon application pour ne rien oublier."}
	/>
</svelte:head>

{@render children()}
