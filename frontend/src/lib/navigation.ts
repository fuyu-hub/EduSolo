
/**
 * Utility to handle arrow key navigation between input fields.
 * This uses geometric positioning to find the best candidate for focus.
 */
export const handleArrowNavigation = (e: React.KeyboardEvent) => {
    const { key } = e;

    // Only handle arrow keys
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

    const current = e.target as HTMLInputElement;
    if (!current || !(current instanceof HTMLInputElement)) return;

    // Boundary checks for Left/Right navigation
    // Only navigate if the cursor is at the beginning/end of the input
    if (key === "ArrowLeft" || key === "ArrowRight") {
        try {
            const isAtStart = current.selectionStart === 0 && current.selectionEnd === 0;
            const isAtEnd = current.selectionStart === current.value.length && current.selectionEnd === current.value.length;

            if (key === "ArrowLeft" && !isAtStart) return;
            if (key === "ArrowRight" && !isAtEnd) return;
        } catch (err) {
            // Some input types (like 'number' in some browsers) don't support selectionStart
            // In these cases, we'll just allow navigation anyway as it's the safest fallback
        }
    }

    // IMPORTANT: Disable default browser behavior for number inputs (increment/decrement)
    // to prevent conflict with our navigation.
    if (current.type === "number" && (key === "ArrowUp" || key === "ArrowDown")) {
        e.preventDefault();
    }

    // Find all focusable inputs in the current page
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not(:disabled):not([readonly])')) as HTMLInputElement[];
    const currentIndex = allInputs.indexOf(current);

    if (currentIndex === -1) return;

    const currentRect = current.getBoundingClientRect();
    const currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2
    };

    let bestMatch: HTMLInputElement | null = null;
    let minDistance = Infinity;

    allInputs.forEach(input => {
        if (input === current) return;

        const rect = input.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        const dx = center.x - currentCenter.x;
        const dy = center.y - currentCenter.y;

        let isCandidate = false;

        // Threshold for being considered "in the same row/column"
        const horizontalThreshold = (currentRect.height + rect.height) / 2;
        const verticalThreshold = (currentRect.width + rect.width) / 2;

        switch (key) {
            case "ArrowRight":
                if (dx > 0 && Math.abs(dy) < horizontalThreshold / 2) isCandidate = true;
                break;
            case "ArrowLeft":
                if (dx < 0 && Math.abs(dy) < horizontalThreshold / 2) isCandidate = true;
                break;
            case "ArrowDown":
                if (dy > 0 && Math.abs(dx) < verticalThreshold / 2) isCandidate = true;
                break;
            case "ArrowUp":
                if (dy < 0 && Math.abs(dx) < verticalThreshold / 2) isCandidate = true;
                break;
        }

        if (isCandidate) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = input;
            }
        }
    });

    // Final fallback for Left/Right if no geometric match
    if (!bestMatch) {
        if (key === "ArrowRight" && currentIndex < allInputs.length - 1) {
            bestMatch = allInputs[currentIndex + 1];
        } else if (key === "ArrowLeft" && currentIndex > 0) {
            bestMatch = allInputs[currentIndex - 1];
        }
    }

    if (bestMatch) {
        e.preventDefault();
        bestMatch.focus();
        const target = bestMatch;
        setTimeout(() => {
            target.select();
        }, 0);
    }
};
