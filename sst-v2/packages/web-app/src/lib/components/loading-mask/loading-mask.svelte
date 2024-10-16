<script lang="ts">
  export let classes = "";
</script>

<div class="{classes} absolute flex justify-center items-center bg-custom-15 w-full h-full">
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
