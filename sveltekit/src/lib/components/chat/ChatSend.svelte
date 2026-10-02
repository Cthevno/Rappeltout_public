<script lang="ts">
    import ChatImg from "$lib/components/chat/ChatImg.svelte";

    /**
     * @file ChatSend.svelte
     * @brief Renders an individual chat message bubble component with user info, timestamp, and styling.
     *
     * This component displays a chat message layout, aligning messages differently depending on
     * whether they belong to the current user, while formatting the timestamp and rendering the user avatar.
     *
     * @param username (string) The display name of the message author.
     * @param msg (string) The text content of the message.
     * @param date (string | Date) The creation timestamp of the message.
     * @param mine (boolean) Flag indicating if the message belongs to the current user.
     *
     * @returns (void) Renders the structured chat message container.
     *
     * step 1 : declare component props and parse timestamp
     *  - accept username, message content, date, and ownership flag via props.
     *  - convert the date into a formatted short hour and minute string (24-hour format).
     *
     * step 2 : render message header and layout
     *  - arrange layout dynamically with row reversal if the message is sent by the current user.
     *  - display the user avatar component (`ChatImg`).
     *  - render the author's username and formatted message time.
     *
     * step 3 : render message bubble body
     *  - apply distinct background colors, borders, and border-radius shapes depending on the message ownership flag.
     *  - display the text content inside a responsive, word-breaking paragraph container.
     */
    const {
        username,
        msg,
        date,
        mine,
    }: { username: string; msg: string; date: string | Date; mine: boolean } =
        $props();

    const newDate = $derived(new Date(date));
    let hour = $derived(
        newDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }),
    );
</script>

<div class="flex flex-col gap-1">
    <div
        class="flex flex-row gap-4 {mine
            ? 'flex-row-reverse justify-start'
            : ''}"
    >
        <ChatImg {username} {mine} />
        <div class="flex flex-col gap-1">
            <div class="text-settings-text flex flex-row items-center gap-2">
                <p class="text-[15px]">
                    {username}
                </p>

                <p class="text-[10px]">
                    {hour}
                </p>
            </div>

            {#if mine === true}
                <p
                    class="font-sans bg-background-red rounded-2xl rounded-tr-xs px-4 py-2 md:text-[16px] text-[12px] text-white w-fit max-w-lg break-words"
                >
                    {msg}
                </p>
            {:else}
                <p
                    class="font-sans bg-settings-bg-card border-settings-border rounded-2xl rounded-tl-xs border-2 px-4 py-2 md:text-[16px] text-[12px] w-fit max-w-lg break-words"
                >
                    {msg}
                </p>
            {/if}
        </div>
    </div>
</div>
