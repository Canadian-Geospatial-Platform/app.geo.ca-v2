<script lang="ts">
  interface Props {
    type?: string;
    children?: import('svelte').Snippet;
  }

  let {
    type = 'default',
    children
  }: Props = $props();
</script>

<div class={[
  "relative flex flex-col rounded",
  type == "default" && "bg-custom-5 p-5 md:p-6 space-y-7 shadow-[0_0.1875rem_0.375rem_#00000029]",
  type == "searchBar"
    && "bg-custom-1 md:bg-custom-5 px-5 py-0 md:px-6 md:py-6 space-y-4 md:space-y-7 md:shadow-[0_0.1875rem_0.375rem_#00000029]",
  type == "tabbed" && "bg-custom-5 p-5 md:p-6 space-y-3 shadow-[0_0.1875rem_0.375rem_#00000029]"
]}>
  {@render children?.()}
</div>
