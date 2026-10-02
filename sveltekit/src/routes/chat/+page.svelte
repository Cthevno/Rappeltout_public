<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { MessageCircle, Smile, Send, RotateCw } from "@lucide/svelte";
    import ChatMessage from "$lib/components/chat/ChatMessage.svelte";
    import ChatSend from "$lib/components/chat/ChatSend.svelte";
    import type { Socket } from "socket.io-client";
    import { onMount, onDestroy } from "svelte";
    import StylizedTitle from "$lib/components/StylizedTitle.svelte";
    import { chatTest } from "./chat_validation";
    import MsgError from "$lib/components/auth/MsgError.svelte";

    /**
     * @brief Initializes the SvelteKit family chat page component with real-time Socket.IO synchronization.
     *
     * This component manages the real-time chat interface for a specific household. It connects
     * to the Socket.IO server, joins the relevant room, loads initial message history, handles
     * sending new messages, and enables pagination to fetch older messages on demand.
     *
     * @param data (Object) Page data supplied by SvelteKit.
     * @param data.houseCode (string) Unique code identifying the household room.
     * @param data.userId (number) Unique identifier of the currently authenticated user.
     * @param data.username (string) Display name of the currently authenticated user.
     *
     * @returns Renders the chat interface and handles dynamic socket event binding.
     *
     * step 1 : initialize state and socket connection
     *  - import required icons, components, and socket.io-client.
     *  - establish reactive states for messages, input content, pagination status, and user context.
     *  - bind the chat container element to manage automated auto-scrolling
     *  - connect to the Socket.IO server on mount and disconnect on destroy.
     *
     * step 2 : handle real-time chat events
     *  - emit the household code to join the specific chat room.
     *  - listen for "loadHistory" to populate initial messages.
     *  - listen for "newMessage" to append incoming real-time messages.
     *  - listen for "loadMoreHistory" to prepend older messages fetched from the server.
     *
     * step 3 : manage user interactions
     *  - send new chat messages via socket emission when the input is valid.
     *  - request older message batches using the ID of the oldest currently loaded message.
     *
     */

    //------- socket connection
    let socket: Socket | null = $state(null);
    //------- message in input
    let content: string = $state("");
    //------- extract props from page data
    let {
        data,
    }: {
        data: {
            houseCode: string;
            userId: number;
            username: string;
            allMessages: any[];
            notifications: {
                id: number;
                type: "MONSTER" | "TASK" | "XP" | "CHALLENGE" | "INVITATION";
                title: string;
                message: string;
                isRead: boolean;
                createdAt: Date;
                href: string | null;
            }[];
            unreadCount: number;
        };
    } = $props();

    let houseCode = $derived(data?.houseCode);
    let userId = $derived(data?.userId);
    let username = $derived(data?.username);

    //------- tab of all messages
    let messages = $state<any[]>([]);
    let initializedHouseCode: string | null = null;

    $effect(() => {
        if (data?.houseCode && data.houseCode !== initializedHouseCode) {
            messages = data?.allMessages ? [...data.allMessages] : [];
            initializedHouseCode = data.houseCode;
        }
    });
    let previousHouseCode: string | undefined;

    //------- initialize socket connection and event listeners on mount
    onMount(async () => {
        const { io } = await import("socket.io-client");

        socket = io();

        //------- load initial message history
        socket.on("loadHistory", (history: any) => {
            messages = history;
            if (history.length < 20) hasMore = false;
            setTimeout(scrollBottom, 0);
        });

        //------- listen for the arrival of a message and add it to the array
        socket?.on("newMessage", (newMessage: any) => {
            messages = [...messages, newMessage];
            setTimeout(scrollBottom, 0);
        });

        //------- load older messages history and handle pagination limit
        socket?.on("loadMoreHistory", (olderMessages: any[]) => {
            if (olderMessages.length === 0 || messages.length < 20) {
                hasMore = false;
                return;
            }
            if (olderMessages.length < 20) hasMore = false;

            messages = [...olderMessages, ...messages];
        });

        setTimeout(scrollBottom, 0);
    });

    //------- join the household room, and rejoin it if the house code changes
    $effect(() => {
        if (!socket || !houseCode) return;

        if (previousHouseCode && previousHouseCode !== houseCode) {
            socket.emit("leaveHouse", previousHouseCode);
        }
        socket.emit("house", houseCode);
        previousHouseCode = houseCode;
    });

    //------- disconnect socket on component destroy
    onDestroy(() => {
        if (socket) socket.disconnect();
    });

    //------- send a new message via socket if input is not empty
    function sendMsg() {
        if (content.trim() !== "" && !errorMsg) {
            socket?.emit("message", { content, houseCode });
            content = "";
        }
    }

    //------- pagination flag for older messages
    let hasMore = $state(true);

    //------- request older messages from the server using the first message id
    function loadingMsg() {
        if (messages.length === 0) return;

        let idLastMsg = messages[0].id;

        socket?.emit("getMoreMessages", { houseCode, idLastMsg });
    }

    //------- reference linked via bind:this to manage and trigger auto-scroll
    let chatScroll: HTMLDivElement;

    //------- force container scroll to the bottom
    function scrollBottom() {
        if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
    }

    let errorMsg = $derived(chatTest(content));
</script>

<div
    class="flex flex-col h-screen m-0 bg-background font-serif overflow-hidden"
>
    <!--HEADER-->
    <Header
        url="/home"
        text="Accueil"
        title="Chat familial"
        Icon={MessageCircle}
        right="nothing"
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    <!--LOADING OLD MESSAGES-->
    <div
        bind:this={chatScroll}
        class="flex-1 p-4 flex flex-col gap-5 overflow-y-auto"
    >
        {#if hasMore}
            <div class="flex justify-center items-center flex-col text-[10px]">
                <button
                    class="flex flex-col items-center justify-center mx-auto cursor-pointer"
                    type="button"
                    onclick={() => loadingMsg()}
                >
                    <RotateCw
                        size={15}
                        class="text-black shrink-0 cursor-pointer"
                    />
                    Recharger les anciens messages
                </button>
            </div>
        {/if}

        <!--DISPLAY MESSAGE-->
        {#each messages as message, i}
            <!--DATE-->
            {@const day = new Date(message.createdAt).toLocaleDateString()}
            {@const today = new Date().toLocaleDateString()}
            {@const yesterday = new Date(
                Date.now() - 86400000,
            ).toLocaleDateString()}

            {#if i === 0 || day !== new Date(messages[i - 1].createdAt).toLocaleDateString()}
                {#if day === today}
                    <StylizedTitle title="Aujourd'hui" />
                {:else if day === yesterday}
                    <StylizedTitle title="Hier" />
                {:else}
                    <StylizedTitle title={day} />
                {/if}
            {/if}

            <!--RECEIVED MESSAGES-->
            {#if message.userId !== userId}
                <div class="flex justify-start w-full max-w-[650px] mx-auto">
                    <ChatSend
                        username={message.user.username}
                        msg={message.content}
                        date={message.createdAt}
                        mine={false}
                    />
                </div>
                <!--SEND MESSAGES-->
            {:else}
                <div class="flex justify-end w-full max-w-[650px] mx-auto">
                    <ChatSend
                        {username}
                        msg={message.content}
                        date={message.createdAt}
                        mine={true}
                    />
                </div>
            {/if}
        {/each}
    </div>

    <!--TEXT ZONE-->
    <div class="flex flex-col justify-center py-2">
        <div class="w-full max-w-[700px] mx-auto flex justify-center">
            <div
                class="h-0 min-w-4 flex-1 border-t border-settings-border"
            ></div>
        </div>

        <div
            class="flex flex-col items-center justify-center mt-auto p-4 w-full gap-4"
        >
            {#if errorMsg}
                <MsgError text={errorMsg} />
            {/if}
            <ChatMessage
                type="string"
                name="msg"
                Icon1={Smile}
                Icon2={Send}
                bind:value={content}
                onSend={sendMsg}
            />
        </div>
    </div>
</div>
