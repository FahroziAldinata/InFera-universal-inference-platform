import { exportCanvasToBlob } from '@infera/plugin-object-detection';

/**
 * Exports the HTMLCanvasElement content containing image + overlays and triggers a browser download.
 * 
 * @param canvas The source canvas element
 * @param format Format type ('png' | 'jpeg')
 * @param filename File name for download
 */
export async function downloadCanvasResult(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpeg',
    filename: string
): Promise<void> {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    
    // Call the core plugin canvas exporter
    const blob = await exportCanvasToBlob(canvas, mimeType);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
