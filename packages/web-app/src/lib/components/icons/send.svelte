<script lang="ts">
  let {
    classes = '',
    width = 20,
    height = 20,
  }: {
    classes?: string;
    width?: number;
    height?: number;
  } = $props();
</script>

<svg class={classes} {width} {height} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
</svg>
