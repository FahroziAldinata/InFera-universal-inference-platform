export const DEFAULT_CLASS_COLORS = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
];

/**
 * Deterministically generates a color based on a classId using HSL.
 */
export function generateClassColor(classId: number): string {
    // Golden angle approximation to distribute hues evenly
    const hue = (classId * 137.5) % 360;
    // Dynamic/stable saturation and lightness
    const saturation = 80;
    const lightness = 50;
    return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
}

/**
 * Gets a consistent color string for a given class ID.
 * If classId fits in customColors or default palette, returns it.
 * Otherwise, generates a deterministic HSL color.
 */
export function getColorForClass(classId: number, customColors?: string[]): string {
    const palette = customColors || DEFAULT_CLASS_COLORS;
    if (classId >= 0 && classId < palette.length) {
        return palette[classId]!;
    }
    return generateClassColor(classId);
}
