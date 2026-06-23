import { describe, it, expect } from 'vitest';
import { getColorForClass, generateClassColor, DEFAULT_CLASS_COLORS } from '../colors';

describe('Color System (Tahap 5.2)', () => {
    it('should return colors from the default palette within range', () => {
        expect(getColorForClass(0)).toBe(DEFAULT_CLASS_COLORS[0]);
        expect(getColorForClass(5)).toBe(DEFAULT_CLASS_COLORS[5]);
        expect(getColorForClass(19)).toBe(DEFAULT_CLASS_COLORS[19]);
    });

    it('should return colors from a custom palette if provided', () => {
        const customPalette = ['#ff0000', '#00ff00', '#0000ff'];
        expect(getColorForClass(0, customPalette)).toBe('#ff0000');
        expect(getColorForClass(2, customPalette)).toBe('#0000ff');
    });

    it('should generate a deterministic HSL color on palette overflow', () => {
        const overflowId1 = DEFAULT_CLASS_COLORS.length + 10;
        const overflowId2 = DEFAULT_CLASS_COLORS.length + 10;
        
        const color1 = getColorForClass(overflowId1);
        const color2 = getColorForClass(overflowId2);
        
        // Deterministic check: same class ID produces same color
        expect(color1).toBe(color2);
        expect(color1.startsWith('hsl(')).toBe(true);
    });

    it('should overflow custom palette and generate deterministic colors', () => {
        const customPalette = ['#ff0000'];
        const color1 = getColorForClass(1, customPalette);
        const color2 = getColorForClass(2, customPalette);
        
        expect(color1.startsWith('hsl(')).toBe(true);
        expect(color2.startsWith('hsl(')).toBe(true);
        expect(color1).not.toBe(color2); // different class IDs should produce different colors
    });

    it('should generate valid HSL values via generateClassColor', () => {
        const hslColor = generateClassColor(42);
        // Format hsl(H, S%, L%)
        expect(hslColor).toMatch(/^hsl\(\d+(\.\d+)?, 80%, 50%\)$/);
    });
});
