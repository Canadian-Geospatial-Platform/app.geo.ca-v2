<script lang="ts">
  interface Props {numRecords: number;}
  let { numRecords = 10 }: Props = $props();
</script>

<!-- Note: the z-index needs to be 100000 because the loading mask on the geoview maps are 99999 -->
<div class="z-[100000] relative flex flex-col top-0 right-0 w-full h-full min-h-80 bg-custom-5 space-y-7">
  <!-- Header -->
  <div class="flex flex-col md:flex-row rounded-sm gap-4">
    <!-- record stats placeholder -->
    <div class="h-[1.875rem] w-full max-w-[28rem] div-fill"></div>
    <!-- sort button placeholder -->
    <div class="h-11 w-full max-w-40 md:ml-auto div-fill"></div>
  </div>
  {#each Array(numRecords) as _, index}
    <!-- accordion placeholder -->
    <div class="px-5 py-4 bg-custom-1 rounded-sm">
      <div>
        <div class="grid grid-cols-12 w-full h-full text-left">
          <!-- Record text placeholder-->
          <div class="col-span-10">
            <!-- record title placeholder -->
            <div class="h-[1.375rem] div-fill"></div>
            <!-- record description placeholder -->
            <div class="h-[3.25rem] mt-1 div-fill-light"></div>
          </div>
          <!-- Expand button placeholder -->
          <div class="col-span-1 col-start-12 self-center">
            <div class="mt-1 mr-3 h-6 md:h-9 w-6 md:w-9 div-fill"></div>
          </div>
        </div>
      </div>
    </div>
  {/each}
  <div class="div-fill h-10 max-w-72 w-full ml-auto"></div>
</div>

<style>
  .div-fill {
    @apply animate-pulse;
    @apply bg-custom-9;
    @apply rounded-md;
  }

  .div-fill-light {
    @apply animate-pulse;
    @apply bg-custom-6;
    @apply rounded-md;
  }
</style>
