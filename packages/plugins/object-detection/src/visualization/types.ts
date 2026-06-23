export interface DrawOptions {
    lineWidth?: number;
    fontSize?: number;
    showLabels?: boolean;
    showConfidence?: boolean;
    showCenterPoint?: boolean;
    classColors?: string[];
    opacity?: number;
    cornerRadius?: number;
    fillOpacity?: number;
    lineDash?: number[];
    labelPosition?: 'top' | 'inside' | 'bottom';
    showBoxes?: boolean;
    hoveredDetectionId?: string | null;
    selectedDetectionId?: string | null;
    lineDashOffset?: number;
    showCrosshair?: boolean;
}

export interface DrawStatistics {
    totalDetections: number;
    renderTimeMs: number;
}
