import type { Action } from 'svelte/action';

export const draggable: Action<HTMLElement> = (node) => {
    const panel = node.closest('#chatbot-panel');

    if (!(panel instanceof HTMLElement)) {
        console.warn('draggable: #chatbot-panel not found');
        return {};
    }

    const panelElement: HTMLElement = panel;

    let isDragging = false;
    let hasMoved = false;

    let offsetX = 0;
    let offsetY = 0;

    const MARGIN = 20;

    function isMobile(): boolean {
        return window.innerWidth <= 768;
    }

    function updatePosition(clientX: number, clientY: number) {
        if (!hasMoved) {
            panelElement.style.right = 'auto';
            panelElement.style.bottom = 'auto';
            hasMoved = true;
        }

        const rect = panelElement.getBoundingClientRect();

        const maxLeft =
            window.innerWidth - rect.width - MARGIN;

        const maxTop =
            window.innerHeight - rect.height - MARGIN;

        let left = Math.max(
            MARGIN,
            Math.min(clientX - offsetX, maxLeft)
        );

        let top = Math.max(
            MARGIN,
            Math.min(clientY - offsetY, maxTop)
        );

        // Safety check: keep right edge visible
        if (left + rect.width > window.innerWidth - MARGIN) {
            left = window.innerWidth - rect.width - MARGIN;
        }

        // Safety check: keep bottom edge visible
        if (top + rect.height > window.innerHeight - MARGIN) {
            top = window.innerHeight - rect.height - MARGIN;
        }

        panelElement.style.left = `${left}px`;
        panelElement.style.top = `${top}px`;
    }

    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }

        const rect = panelElement.getBoundingClientRect();

        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;

        hasMoved = false;
        isDragging = true;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        event.preventDefault();
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) {
            return;
        }

        updatePosition(
            event.clientX,
            event.clientY
        );
    }

    function handleMouseUp() {
        isDragging = false;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleTouchStart(event: TouchEvent) {
        if (isMobile()) {
            return;
        }

        const touch = event.touches[0];

        const rect = panelElement.getBoundingClientRect();

        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        hasMoved = false;
        isDragging = true;

        document.addEventListener(
            'touchmove',
            handleTouchMove,
            { passive: false }
        );

        document.addEventListener(
            'touchend',
            handleTouchEnd
        );

        event.preventDefault();
    }

    function handleTouchMove(event: TouchEvent) {
        if (!isDragging) {
            return;
        }

        const touch = event.touches[0];

        updatePosition(
            touch.clientX,
            touch.clientY
        );

        event.preventDefault();
    }

    function handleTouchEnd() {
        isDragging = false;

        document.removeEventListener(
            'touchmove',
            handleTouchMove
        );

        document.removeEventListener(
            'touchend',
            handleTouchEnd
        );
    }

    node.addEventListener(
        'mousedown',
        handleMouseDown
    );

    node.addEventListener(
        'touchstart',
        handleTouchStart,
        { passive: false }
    );

    return {
        destroy() {
            node.removeEventListener(
                'mousedown',
                handleMouseDown
            );

            node.removeEventListener(
                'touchstart',
                handleTouchStart
            );

            document.removeEventListener(
                'mousemove',
                handleMouseMove
            );

            document.removeEventListener(
                'mouseup',
                handleMouseUp
            );

            document.removeEventListener(
                'touchmove',
                handleTouchMove
            );

            document.removeEventListener(
                'touchend',
                handleTouchEnd
            );
        }
    };
};