<script lang="ts">
  interface Props {
    direction?: 'horizontal' | 'vertical';
    value: number;
    min?: number;
    max?: number;
  }

  let { direction = 'vertical', value = $bindable(), min = 20, max = 80 }: Props = $props();

  let handle: HTMLDivElement;
  let dragging = $state(false);

  function pointerDown(event: PointerEvent) {
    event.preventDefault();

    const container = handle.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const startX = event.clientX;
    const startY = event.clientY;
    const startValue = value;

    dragging = true;
    handle.setPointerCapture(event.pointerId);

    function pointerMove(e: PointerEvent) {
      let deltaPercent: number;

      if (direction === 'vertical') {
        deltaPercent = ((e.clientX - startX) / rect.width) * 100;
      } else {
        deltaPercent = ((e.clientY - startY) / rect.height) * 100;
      }

      value = Math.min(max, Math.max(min, startValue + deltaPercent));
    }

    function pointerUp(e: PointerEvent) {
      dragging = false;
      handle.releasePointerCapture(e.pointerId);

      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
    }

    // Tell GeoView the layout changed.
    if (direction === 'horizontal') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
    }

    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
  }

  function keydown(event: KeyboardEvent) {
    const step = 5;

    if (direction === 'vertical') {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        value = Math.max(min, value - step);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        value = Math.min(max, value + step);
      }
    } else {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        value = Math.max(min, value - step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        value = Math.min(max, value + step);
      }
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={handle}
  class="splitter"
  class:dragging
  class:vertical={direction === 'vertical'}
  class:horizontal={direction === 'horizontal'}
  role="separator"
  tabindex="0"
  aria-orientation={direction}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  onpointerdown={pointerDown}
  onkeydown={keydown}
>
  <div class="grip"></div>
</div>

<style>
  .splitter {
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    touch-action: none;
    background: #f8f9fa;
    transition: background 0.15s ease;
  }

  .splitter:hover,
  .splitter.dragging {
    background: #e5e7eb;
  }

  .vertical {
    width: 8px;
    cursor: col-resize;
  }

  .horizontal {
    height: 8px;
    cursor: row-resize;
  }

  .vertical .grip {
    width: 2px;
    height: 32px;
    border-radius: 1px;
    background: #9ca3af;
  }

  .horizontal .grip {
    width: 32px;
    height: 2px;
    border-radius: 1px;
    background: #9ca3af;
  }
</style>
