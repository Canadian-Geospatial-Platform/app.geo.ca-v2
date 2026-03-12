/**
 * Sets the position of a dropdown menu to ensure it stays within the viewport.
 *
 * @param node - The dropdown menu element.
 * @param isHorizontal - Whether the menu is horizontal.
 * @returns An object with a destroy method to clean up observers and event listeners.
 */
export function setPosition(
	node: HTMLElement,
	isHorizontal: boolean
): { destroy: () => void } | void {
	/**************************************************************************
	 * The purpose of this function is to ensure that the menu dropdowns don't
	 * flow off the page for smaller screens. In the case where the default
	 * position is off screen, a vertical translation is applied.
	 ***************************************************************************/
	if (isHorizontal) {
		let nodeBounding: DOMRect;
		let nodeLeft: number;
		let nodeWidth: number;
		let transformX: number;
		let transformed: boolean;
		let observer = new MutationObserver(function (): void {
			/***********************************************************************
			 *  Note: The 'shifted' class will act as a flag to indicate if the
			 *  node has already been shifted or not to prevent an infinate loop.
			 *
			 *  It will be removed when the window has been resized to set the new
			 *  translate value, and readded at the end of the calcPosition method.
			 ************************************************************************/
			if (
				window.getComputedStyle(node, null).display !== 'none' &&
				!node.classList.contains('shifted')
			) {
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
			// Reset default transform value
			nodeBounding = node.getBoundingClientRect();
			nodeWidth = nodeBounding.width;
			transformX = 0 - nodeWidth / 2;
			node.style.transform = 'translate(' + transformX + 'px, 0px)';

			// Get the new bounding rectangle after transform
			nodeBounding = node.getBoundingClientRect();
			nodeLeft = nodeBounding.left;
			transformed = false;

			// Set horizontal translation if node is off screen
			if (nodeLeft < 0) {
				transformX = 5 - nodeLeft - nodeWidth / 2;
				transformed = true;
			}

			// Transform node position if needed.
			if (transformed) {
				node.style.transform = 'translate(' + transformX + 'px, 0px)';
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
			}
		};
	}
}
