<script lang="ts">
  interface Props {numRecords: number;}
  let { numRecords = 10 }: Props = $props();
</script>

<div class="relative flex flex-col top-0 right-0 w-full h-full min-h-80">
  <!-- Description -->
  <div class="flex flex-col rounded-sm gap-1.5 mt-2 mb-4">
    <!-- description paragraph placeholder -->
    <div class="h-5 w-full div-fill"></div>
    <div class="h-5 w-full div-fill-light"></div>
    <div class="h-5 w-4/5 div-fill-light"></div>
  </div>

  <table class="w-full bg-custom-5 rounded-md">
    <thead>
      <tr>
        <!-- select all placeholder-->
        <th class="w-40">
          <div class="flex flex-col items-center gap-2 my-4 mx-3">
            <div class="h-9 w-full div-fill"></div>
          </div>
        </th>

        <!-- resource name label placeholder -->
        <th class="w-1/2">
          <div class="flex flex-row justify-between rounded-sm my-4 mx-3">
            <div class="h-9 w-full div-fill"></div>
          </div>
        </th>

        <!-- resource id label placeholder -->
        <th class="hidden sm:table-cell">
          <div class="flex flex-row justify-between rounded-sm my-4 mx-3">
            <div class="h-9 w-full div-fill"></div>
          </div>
        </th>
      </tr>
    </thead>

    <tbody>
      {#each Array(numRecords) as _, index}
        <tr>
          <!-- checkbox column placeholder-->
          <td>
            <div class="flex flex-col items-center">
              <div class="h-8 w-8 div-fill"></div>
            </div>
          </td>

          <!-- resource name placeholder -->
          <td>
            <div class="flex flex-col rounded-sm gap-2 m-3">
              <div class="h-5 w-full div-fill"></div>
              <div class="h-5 w-4/5 div-fill-light"></div>
            </div>
          </td>

          <!-- resource id placeholder -->
          <td class="hidden sm:table-cell">
            <div class="flex flex-col rounded-sm gap-2 m-3">
              <div class="h-5 w-full div-fill"></div>
              <div class="h-5 w-2/5 div-fill-light"></div>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- buttons placeholder -->
<div class="sm:flex">
  <div class="sm:grow">
    <div class="sm:inline-block div-fill h-11 w-full sm:w-56 mt-5 sm:mr-5"></div>
  </div>
  <div class="sm:inline-block div-fill h-11 w-full sm:w-56 mt-5"></div>
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
