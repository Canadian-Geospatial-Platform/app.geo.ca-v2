<script lang="ts">
  export let bgColour = 'bg-custom-5';
  export let padding = 'p-5 md:p-6';
  export let spaceBetween = 'space-y-7';
</script>

<div class={"relative flex flex-col rounded-sm " + bgColour + " " + padding + " " + spaceBetween}>
  <slot />
</div>