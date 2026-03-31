<script lang="ts">
  import { fly } from 'svelte/transition';
  import { page } from '$app/state';
  import Chevronleft from '$lib/components/icons/chevronleft.svelte';
  import Chevronright from '$lib/components/icons/chevronright.svelte';

  type CarouselCard = {
    title: string;
    description: string;
    url: string;
  };

  interface Props {
    cardData: Array<CarouselCard>;
  }

  let { cardData }: Props = $props();

  let lang = page.data.lang;

  let activeIndex = $state(0);
  let nextIndex = $state(1);
  let slideDirection = $state(1);
  let flyLength = $state(0);

  /*************** Aria Labels ***************/
  const carouselLabel = lang === 'fr-ca' ? 'Carrousel de dossiers similaires' : 'Similar records carousel';
  const similarRecordLabelPrefix = lang === 'fr-ca' ? 'Dossiers similaire ' : 'Similar record ';

  /*************** Utility methods ***************/

  /**
   * Increment or decrement the slide index by either be 1 (increment) or -1 (decrement).
   *
   * @param direction - The direction to change the index by (1 or -1)
   */
  function changeIndex(direction: number): void {
    setFlyLength();
    slideDirection = direction;
    activeIndex = (activeIndex + direction + cardData.length) % cardData.length;
    nextIndex = (activeIndex + 1) % cardData.length;
  }

  /**
   * Sets the flyLength variable based on the width of a carousel card.
   * This determines how far the cards should translate during the fly transition.
   */
  function setFlyLength(): void {
    // Get the size of a carousel card to determine the amount a slide should translate
    const cardEl1 = document.getElementById('carousel-card-1');
    const cardEl2 = document.getElementById('carousel-card-2');

    // Add 20px to the card's width to account for the gutter between the two cards,
    // but only if both cards are visible
    const gutter = 20;
    const width = cardEl2?.checkVisibility() ? (cardEl1?.offsetWidth ?? 0) + gutter : (cardEl1?.offsetWidth ?? 0);
    flyLength = width;
  }

  /*************** Handlers ***************/

  /**
   * Handle clicking on either the increment index or decrement index buttons.
   *
   * @param direction - The direction to change the index by (1 or -1)
   */
  function handleChangeIndex(direction: number): void {
    changeIndex(direction);
  }

  /**
   * Handle clicking on one of the select index buttons. Sets the slide index to the index of the clicked button.
   *
   * @param index - The index to set the slide to
   */
  function handleIndexButtonClick(index: number): void {
    setFlyLength();
    slideDirection = index > activeIndex ? 1 : -1;
    activeIndex = (index + cardData.length) % cardData.length;
    nextIndex = (activeIndex + 1) % cardData.length;
  }
</script>

<!-- Card Container -->
<div class="flex flex-col relative w-full mt-4 font-custom-style-body-carousel overflow-x-hidden" aria-label={carouselLabel}>
  <!-- Carousel Cards -->
  <div class="flex gap-6 h-64 w-full">
    <!-- Card 1 -->
    <div class="relative w-full sm:w-1/2" id="carousel-card-1">
      {#key activeIndex}
        <!--
          Note: the rel="external" ensures that the page data is updated, so when the
          page loads, the correct record data is displayed.
        -->
        <a
          class="carousel-card group"
          href={cardData[activeIndex].url}
          rel="external"
          in:fly={{ x: slideDirection * flyLength, duration: 500, opacity: 100 }}
          out:fly={{ x: slideDirection * -flyLength, duration: 500, opacity: 0 }}
        >
          <h3 class="carousel-card-title font-custom-style-h1-carousel">
            {cardData[activeIndex].title}
          </h3>
          <p class="carousel-card-p">
            {cardData[activeIndex].description}
          </p>
        </a>
      {/key}
    </div>

    <!-- Card 2 -->
    <div class="relative hidden sm:block w-full sm:w-1/2" id="carousel-card-2">
      {#key nextIndex}
        <a
          class="carousel-card group"
          href={cardData[nextIndex].url}
          rel="external"
          in:fly={{ x: slideDirection * flyLength, duration: 500, opacity: 100 }}
          out:fly={{ x: slideDirection * -flyLength, duration: 500, opacity: 0 }}
        >
          <h3 class="carousel-card-title font-custom-style-h1-carousel">
            {cardData[nextIndex].title}
          </h3>
          <p class="carousel-card-p">
            {cardData[nextIndex].description}
          </p>
        </a>
      {/key}
    </div>
  </div>

  <!-- Nav Buttons -->
  <div class="flex w-full mt-4">
    <!-- Decrement Button -->
    <button onclick={() => handleChangeIndex(-1)}>
      <span class="change-index-button">
        <Chevronleft classes="h-6 sm:h-7 md:h-9 relative" />
      </span>
    </button>

    <!-- Select Index Buttons -->
    <div class="grow flex justify-center text-center">
      {#each cardData as card, index (`${index}-${card.title}`)}
        {#if index === activeIndex}
          <button
            name={`Button-${card.title}`}
            class="card-index text-lg hover:text-xl text-custom-20"
            onclick={() => handleIndexButtonClick(index)}
            aria-label={similarRecordLabelPrefix + (index + 1)}
          >
            &#x2B24;
          </button>
        {:else}
          <button
            class="card-index text-[10px] sm:text-[12px] hover:text-base text-custom-24 hover:text-custom-20"
            onclick={() => handleIndexButtonClick(index)}
            aria-label={similarRecordLabelPrefix + (index + 1)}
          >
            &#x2B24;
          </button>
        {/if}
      {/each}
    </div>

    <!-- Increment Button -->
    <button onclick={() => handleChangeIndex(1)}>
      <span class="change-index-button">
        <Chevronright classes="h-6 sm:h-7 md:h-9 relative" />
      </span>
    </button>
  </div>
</div>

<style lang="postcss">
  .carousel-card {
    @apply absolute;
    @apply inset-0;
    @apply flex;
    @apply flex-col;
    @apply justify-center;
    @apply p-5;
    @apply w-full;
    @apply h-full;
    @apply overflow-hidden;
    @apply bg-custom-5;
    @apply rounded-md;
    @apply shadow-[0_0.1875rem_0.375rem_#00000029];
  }

  .carousel-card:hover {
    @apply bg-custom-25;
  }

  .carousel-card-title {
    @apply mb-2.5;
    @apply underline;
    @apply line-clamp-2;
    @apply group-hover:no-underline;
  }

  .carousel-card-p {
    @apply line-clamp-6;
  }

  .card-index {
    @apply inline-block;
    @apply align-middle;
    @apply p-1;
    @apply sm:p-1.5;
    text-shadow: 0px 0.1875rem 0.375rem #00000030;
  }

  .change-index-button {
    @apply block;
    @apply rounded-full;
    @apply p-1.5;
    @apply m-1;
    @apply bg-custom-1;
    @apply text-custom-16;
    @apply self-center;
    @apply justify-self-center;
  }

  .change-index-button:hover {
    @apply bg-custom-5;
    @apply shadow-[0_0.1875rem_0.375rem_#00000029];
  }
</style>
