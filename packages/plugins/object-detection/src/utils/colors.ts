/**
 * Palette of colors to assign to bounding boxes based on class ID
 */
export const CLASS_COLORS = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
];

/**
 * Gets a consistent hex color string for a given class ID
 */
export function getColorForClass(classId: number): string {
    return CLASS_COLORS[classId % CLASS_COLORS.length] || '#ff0000';
}
