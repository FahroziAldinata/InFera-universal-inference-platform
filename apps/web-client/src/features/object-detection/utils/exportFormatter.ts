import type { Detection } from '@infera/plugin-object-detection';

export interface FormatterMetadata {
    imageName: string;
    imageWidth: number;
    imageHeight: number;
}

export interface ExportFormatter {
    id: string;
    name: string;
    mimeType: string;
    extension: string;
    format(detections: Detection[], meta: FormatterMetadata): string;
}

// 1. JSON Formatter
export class JSONFormatter implements ExportFormatter {
    id = 'json';
    name = 'JSON';
    mimeType = 'application/json';
    extension = 'json';

    format(detections: Detection[]): string {
        return JSON.stringify(detections, null, 2);
    }
}

// 2. CSV Formatter
export class CSVFormatter implements ExportFormatter {
    id = 'csv';
    name = 'CSV';
    mimeType = 'text/csv';
    extension = 'csv';

    format(detections: Detection[]): string {
        const headers = ['id', 'classId', 'className', 'confidence', 'x', 'y', 'width', 'height'];
        const rows = detections.map((det, idx) => [
            det.id || `det_${idx}`,
            det.classId,
            `"${det.className.replace(/"/g, '""')}"`,
            det.confidence.toFixed(4),
            det.x.toFixed(2),
            det.y.toFixed(2),
            det.width.toFixed(2),
            det.height.toFixed(2)
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}

// 3. COCO JSON Formatter
export class COCOFormatter implements ExportFormatter {
    id = 'coco';
    name = 'COCO JSON';
    mimeType = 'application/json';
    extension = 'json';

    format(detections: Detection[], meta: FormatterMetadata): string {
        const uniqueCategories = Array.from(new Set(detections.map(d => d.classId)))
            .map(classId => {
                const det = detections.find(d => d.classId === classId);
                return {
                    id: classId,
                    name: det?.className || `class_${classId}`,
                    supercategory: 'object'
                };
            });

        const coco = {
            info: {
                description: 'Infera Object Detection Export',
                version: '1.0',
                year: new Date().getFullYear(),
                contributor: 'Infera Platform',
                date_created: new Date().toISOString().split('T')[0]
            },
            images: [
                {
                    id: 1,
                    width: meta.imageWidth,
                    height: meta.imageHeight,
                    file_name: meta.imageName
                }
            ],
            annotations: detections.map((det, idx) => ({
                id: idx + 1,
                image_id: 1,
                category_id: det.classId,
                bbox: [
                    parseFloat(det.x.toFixed(2)),
                    parseFloat(det.y.toFixed(2)),
                    parseFloat(det.width.toFixed(2)),
                    parseFloat(det.height.toFixed(2))
                ],
                area: parseFloat((det.width * det.height).toFixed(2)),
                segmentation: [],
                iscrowd: 0
            })),
            categories: uniqueCategories
        };

        return JSON.stringify(coco, null, 2);
    }
}

// 4. YOLO TXT Formatter
export class YOLOFormatter implements ExportFormatter {
    id = 'yolo';
    name = 'YOLO';
    mimeType = 'text/plain';
    extension = 'txt';

    format(detections: Detection[], meta: FormatterMetadata): string {
        const { imageWidth, imageHeight } = meta;
        if (!imageWidth || !imageHeight) return '';

        return detections.map(det => {
            const xCenter = det.x + det.width / 2;
            const yCenter = det.y + det.height / 2;

            const xRel = xCenter / imageWidth;
            const yRel = yCenter / imageHeight;
            const wRel = det.width / imageWidth;
            const hRel = det.height / imageHeight;

            return `${det.classId} ${xRel.toFixed(6)} ${yRel.toFixed(6)} ${wRel.toFixed(6)} ${hRel.toFixed(6)}`;
        }).join('\n');
    }
}

// 5. Pascal VOC XML Formatter
export class VOCFormatter implements ExportFormatter {
    id = 'voc';
    name = 'Pascal VOC XML';
    mimeType = 'application/xml';
    extension = 'xml';

    format(detections: Detection[], meta: FormatterMetadata): string {
        const objectsXml = detections.map(det => `    <object>
        <name>${det.className}</name>
        <pose>Unspecified</pose>
        <truncated>0</truncated>
        <difficult>0</difficult>
        <bndbox>
            <xmin>${Math.round(det.x)}</xmin>
            <ymin>${Math.round(det.y)}</ymin>
            <xmax>${Math.round(det.x + det.width)}</xmax>
            <ymax>${Math.round(det.y + det.height)}</ymax>
        </bndbox>
    </object>`).join('\n');

        return `<?xml version="1.0"?>
<annotation>
    <folder>Infera</folder>
    <filename>${meta.imageName}</filename>
    <size>
        <width>${meta.imageWidth}</width>
        <height>${meta.imageHeight}</height>
        <depth>3</depth>
    </size>
${objectsXml}
</annotation>`;
    }
}

// 6. Label Studio JSON Formatter
export class LabelStudioFormatter implements ExportFormatter {
    id = 'labelstudio';
    name = 'Label Studio JSON';
    mimeType = 'application/json';
    extension = 'json';

    format(detections: Detection[], meta: FormatterMetadata): string {
        const { imageWidth, imageHeight } = meta;
        const result = detections.map((det, idx) => ({
            id: det.id || `result_${idx}`,
            type: 'rectanglelabels',
            from_name: 'label',
            to_name: 'image',
            original_width: imageWidth,
            original_height: imageHeight,
            image_rotation: 0,
            value: {
                x: parseFloat(((det.x / imageWidth) * 100).toFixed(4)),
                y: parseFloat(((det.y / imageHeight) * 100).toFixed(4)),
                width: parseFloat(((det.width / imageWidth) * 100).toFixed(4)),
                height: parseFloat(((det.height / imageHeight) * 100).toFixed(4)),
                rotation: 0,
                rectanglelabels: [det.className]
            }
        }));

        const exportData = {
            data: {
                image: `/data/upload/${meta.imageName}`
            },
            predictions: [
                {
                    model_version: 'infera-0.2.0',
                    score: 1.0,
                    result
                }
            ]
        };

        return JSON.stringify(exportData, null, 2);
    }
}

// Registry of available export formatters
export const EXPORT_FORMATTERS: ExportFormatter[] = [
    new JSONFormatter(),
    new CSVFormatter(),
    new COCOFormatter(),
    new YOLOFormatter(),
    new VOCFormatter(),
    new LabelStudioFormatter()
];

/**
 * Utility to trigger download of string content as a file in browser
 */
export function downloadStringAsFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
