/**
 * Haptic feedback patterns
 */
export const HapticPatterns = {
    // Ultra light tap for frequent interactions (keyboard-like)
    Light: 5,

    // Standard click feedback
    Medium: 10,

    // Heavier feedback for important actions (delete, save)
    Heavy: 20,

    // Success pattern (double tap)
    Success: [10, 50, 10],

    // Error pattern (rumble)
    Error: [50, 100, 50],

    // Selection pattern for drag & drop
    Selection: 15,
};

/**
 * Triggers haptic feedback if the device supports it.
 * @param pattern The vibration pattern (ms or array of ms)
 */
export const triggerHaptic = (pattern: number | number[] = HapticPatterns.Medium) => {
    // Check if Vibration API is supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore errors (some browsers might block it if not initiated by user action)
            console.debug('Haptic feedback blocked or not supported', e);
        }
    }
};
