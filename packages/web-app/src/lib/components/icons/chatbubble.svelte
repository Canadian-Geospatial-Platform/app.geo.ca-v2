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

<!--
  Source: https://css.gg/message
  Licence: MIT https://css.gg/doc/licence

  Explicit width/height defaults are required because WordPress/Elementor
  does not consistently apply Tailwind SVG sizing classes (e.g. h-4/w-4)
  in the bundled widget, which can cause the icon to render at 0×0 or
  incorrect sizes.
  Example: <ChatBubbleIcon width={16} height={16} />
-->
<svg class={`chat-bubble-icon ${classes}`} {width} {height} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path d="M10 2C5.589 2 2 5.134 2 9c0 1.657.672 3.162 1.764 4.313L2 18l4.922-1.29A9.96 9.96 0 0010 17c4.411 0 8-3.134 8-7s-3.589-8-8-8z" />
</svg>
