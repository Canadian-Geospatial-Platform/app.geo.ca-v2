<script lang="ts">
  interface Props {
    classes?: string;
  }

  let { classes = "" }: Props = $props();
</script>

<!-- Note: the z-index needs to be 100000 because the loading mask on the geoview maps are 99999 -->
<div class="{classes} flex justify-center bg-custom-15 w-full h-full z-[100000]">
  <!-- TODO: Change loading annimation to the same as canadian-geospatial-platform for consistency -->
  <div class="loader">
    <div class="inner-loader"></div>
  </div>
</div>

<style>
  .loader {
    background: linear-gradient(0deg, #212529 50%, #535AA4 100%);
    @apply rounded-[50%];
    @apply animate-[spin_2s_linear_infinite];
    @apply w-28;
    @apply h-28;
    @apply flex;
    @apply justify-center;
    @apply items-center;
  }

  .inner-loader {
    @apply w-[85%];
    @apply h-[85%];
    @apply rounded-[50%];
    @apply bg-custom-15;
  }
</style>
