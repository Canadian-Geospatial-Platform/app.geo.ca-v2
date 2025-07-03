// When there is some type of overlay i.e. the menu or filter modal,
// we want the scrolling on the main content to be disabled so that only the
// overlay is active. To achieve this, we can temporarily set the position of
// the page to 'fixed' to prevent scrolling, and the overflow to 'scroll'
// to prevent the page from shifting as the scroll is toggled. Setting the
// top of the body to the scroll position of the window ensures the page
// doesn't jump to the top when toggling the scroll.

export function toggleScroll(active: Boolean) {
	// Check if 'document' is defined to avoid error during server side rendering
	if (typeof document !== 'undefined') {
		const body = document.body;

		if (active) {
			// Store the current scroll position
			const scrollY = window.scrollY;
			body.style.setProperty('--scroll-y', `${scrollY}px`);

			// Store the current scrollbar width
			const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
			body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

			// Set styles
			body.style.top = `-${scrollY}px`;
			body.style.overflow = 'hidden';
			body.style.width = `calc(100vw - ${scrollbarWidth}px)`;
		} else {
			// Get the stored scroll value. For the scrollTo method, convert it to a number
			const scrollY = parseInt(body.style.getPropertyValue('--scroll-y') || '0', 10);

			// Revert styles
			body.style.top = '';
			body.style.overflow = '';
			body.style.width = '';

			window.scrollTo(0, scrollY);
		}
	}
}
