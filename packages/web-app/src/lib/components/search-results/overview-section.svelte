<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { marked } from 'marked';
  import { tick } from 'svelte';
  import ChatBubble from '$lib/components/icons/chatbubble.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';

  /************* Translations ***************/
  const translations = page.data.t;

  const aiOverview = translations?.aiOverview ? translations['aiOverview'] : 'AI Overview';
  const showMore = translations?.showMore ? translations['showMore'] : 'Show more';
  const showLess = translations?.showLess ? translations['showLess'] : 'Show less';
  const noOverviewAvailable = translations?.noOverviewAvailable ? translations['noOverviewAvailable'] : 'No overview available.';
  const diveDeeperWithGeoChat = translations?.diveDeeperWithGeoChat ? translations['diveDeeperWithGeoChat'] : 'Dive deeper with GeoChat';

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  let { overviewData, isLoading } = $props();

  let html = $state('');
  let expanded = $state(false);
  let isOverflowing = $state(false);

  let contentRef = $state<HTMLDivElement | null>(null);
  let containerRef = $state<HTMLDivElement | null>(null);

  let maxHeight = $state('7.5rem'); // ~5 lines

  let titleRef = $state<HTMLHeadingElement | null>(null);

  $effect(() => {
    const updateOverview = async () => {
      const markdown = overviewData?.overview_markdown;

      if (markdown) {
        html = (await marked.parse(markdown)) as string;

        expanded = false;

        await tick();

        if (contentRef) {
          isOverflowing = contentRef.scrollHeight > contentRef.clientHeight;

          maxHeight = '7.5rem';
        }
      } else {
        html = '';
        isOverflowing = false;
      }
    };

    updateOverview();
  });

  async function toggleExpand() {
    if (!contentRef) return;

    const startHeight = contentRef.clientHeight;

    expanded = !expanded;

    await tick();

    const endHeight = expanded ? contentRef.scrollHeight : 120;

    maxHeight = `${startHeight}px`;

    await tick();

    maxHeight = `${endHeight}px`;

    if (!expanded) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = titleRef?.getBoundingClientRect();

          if (rect) {
            window.scrollTo({
              top: window.scrollY + rect.top - 10,
              behavior: 'smooth',
            });
          }
        });
      });
    }
  }

  function handleDiveDeeper() {
    const locale = page.params.lang ?? 'en-ca';
    const searchTerm = page.url.searchParams.get('search-terms') || '';

    goto(`/${locale}/geochat?search-terms=${encodeURIComponent(searchTerm)}`);
  }
</script>

{#if isLoading}
  <h2 class="font-custom-style-h2 mt-5 px-5 md:px-0">{aiOverview}</h2>

  <!-- CARD -->
  <div class="mt-2">
    <div class="bg-gray-100 border border-gray-200 rounded-lg px-5 pt-5 pb-5 shadow-md">
      <div class="bg-white rounded-md px-5 pt-5 pb-4 border border-gray-200 shadow-sm">
        <!-- SKELETON CONTENT -->
        <div class="space-y-3 animate-pulse">
          <div class="h-4 bg-gray-300 rounded w-1/3"></div>
          <div class="h-4 bg-gray-300 rounded w-full"></div>
          <div class="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <h2 bind:this={titleRef} class="font-custom-style-h2 mt-5 px-5 md:px-0">{aiOverview}</h2>

  <div bind:this={containerRef} class="mt-1">
    <div class="bg-gray-100 border border-gray-200 rounded-lg px-5 pt-5 pb-5 shadow-md">
      <div class="bg-white rounded-md px-5 pt-5 pb-4 border border-gray-200 shadow-sm">
        {#if html}
          <div class="relative">
            <!-- CONTENT -->
            <div
              bind:this={contentRef}
              class="overview-content prose prose-neutral max-w-none overflow-hidden transition-all duration-300 ease-in-out"
              style={`max-height: ${maxHeight}`}
            >
              {@html html}
            </div>

            <!-- GRADIENT -->
            {#if isOverflowing && !expanded}
              <div class="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#f6f6f6] to-transparent"></div>
            {/if}
          </div>

          <!-- BUTTON -->
          {#if isOverflowing}
            <button
              class="mt-3 flex items-center gap-1.5 text-custom-8 text-sm font-medium hover:underline hover:text-custom-10 transition-all duration-200 hover:translate-y-[1px]"
              onclick={toggleExpand}
            >
              {expanded ? showLess : showMore}

              <Chevrondown classes={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          {/if}
        {:else}
          <div class="text-gray-500 text-sm">{noOverviewAvailable}</div>
        {/if}
      </div>

      <!-- DIVE DEEPER -->
      <div class="mt-5 flex flex-col items-center">
        <button
          class="flex items-center gap-2 h-12 px-5 bg-custom-8 hover:bg-custom-10 text-white font-custom-style-button-3 rounded-md transition-all duration-200 hover:shadow-md active:translate-y-[1px] cursor-pointer"
          onclick={handleDiveDeeper}
        >
          <ChatBubble classes="w-5 h-5 shrink-0" />
          {diveDeeperWithGeoChat}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.clamp-5) {
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  :global(.overview-content p) {
    margin-bottom: 0.6rem;
    line-height: 1.45;
  }

  :global(.overview-content li) {
    margin-bottom: 0.1rem;
    line-height: 1.45;
  }

  :global(.overview-content li p) {
    margin-bottom: 0.9rem;
  }

  :global(.overview-content ol) {
    margin-bottom: 0.15rem;
    padding-left: 1.5rem;
  }

  :global(.overview-content ol + p) {
    margin-left: 1.5rem;
  }

  :global(.overview-content ul) {
    margin-top: 0.15rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  :global(.overview-content a) {
    color: #515ba4;
    text-decoration: underline;
    word-break: break-word;
  }

  :global(.overview-content a:hover) {
    color: #495197;
  }

  :global(.overview-content strong) {
    font-weight: 700;
    color: #000;
  }
</style>
