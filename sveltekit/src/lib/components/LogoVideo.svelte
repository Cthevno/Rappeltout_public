<script lang="ts">
    /**
     * @file LogoVideo.svelte
     * @brief Animated video of the Rappeltout logo (webm/mp4 with poster), available in several sizes.
     * @param size (80 | 183 | 354) Size in pixels (width and height) of the video.
     */
    let { size }: { size: 80 | 183 | 354 } = $props();
</script>

<svelte:head>
    <link
        rel="preload"
        as="image"
        href="/auth/Rappeltout_poster_{size}.webp"
        fetchpriority="high"
    />
</svelte:head>

<video
    width={size}
    height={size}
    aria-hidden="true"
    poster="/auth/Rappeltout_poster_{size}.webp"
    autoplay
    loop
    muted
    playsinline
    preload="metadata"
    style="max-width: 100%; height: auto; display: block;"
>
    <!-- The browser tries WebM first (lighter), then falls back to MP4 -->
    <source src="/auth/Rappeltout_{size}.webm" type="video/webm" />
    <source src="/auth/Rappeltout_{size}.mp4" type="video/mp4" />
    Votre navigateur ne supporte pas la vidéo HTML5.
</video>
