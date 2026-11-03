/**
 * Sets the position of a dropdown menu to ensure it stays within the viewport.
 *
 * @param node - The dropdown menu element.
 * @param isHorizontal - Whether the menu is horizontal.
 * @returns An object with a destroy method to clean up observers and event listeners.
 */
export function setPosition(node: HTMLElement, isHorizontal: boolean): { destroy: () => void } | void {
  /**************************************************************************
   * The purpose of this function is to ensure that the menu dropdowns don't
   * flow off the page for smaller screens. In the case where the default
   * position is off screen, a vertical translation is applied.
   ***************************************************************************/
  if (isHorizontal) {
    let nodeBounding: DOMRect;
    let shiftX: number;
    const observer = new MutationObserver(function (): void {
      /***********************************************************************
       *  Note: The 'shifted' class will act as a flag to indicate if the
       *  node has already been shifted or not to prevent an infinate loop.
       *
       *  It will be removed when the window has been resized to set the new
       *  translate value, and readded at the end of the calcPosition method.
       ************************************************************************/
      if (window.getComputedStyle(node, null).display !== 'none' && !node.classList.contains('shifted')) {
        calcPosition();
      }
    });

    /**
     * Handles the window resize event.
     */
    function handleResize(): void {
      node.classList.remove('shifted');
    }

    /**
     * Calculates and sets the position of the dropdown menu.
     */
    function calcPosition(): void {
      // Start with CSS centering and no JS offset.
      node.style.setProperty('--dropdown-shift-x', '0px');
      nodeBounding = node.getBoundingClientRect();
      shiftX = 0;

      const viewportLeft = 5;
      const viewportRight = window.innerWidth - 5;

      // Nudge right if off-screen on the left.
      if (nodeBounding.left < viewportLeft) {
        shiftX += viewportLeft - nodeBounding.left;
      }

      // Nudge left if off-screen on the right.
      if (nodeBounding.right > viewportRight) {
        shiftX -= nodeBounding.right - viewportRight;
      }

      if (shiftX !== 0) {
        node.style.setProperty('--dropdown-shift-x', `${shiftX}px`);
      }

      // Add 'shifted' class to avoid infinate loop
      node.classList.add('shifted');
    }

    observer.observe(node, { attributes: true, childList: true });
    window.addEventListener('resize', handleResize);

    return {
      destroy() {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
      },
    };
  }
}
