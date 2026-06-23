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
}

export interface DrawStatistics {
    totalDetections: number;
    renderTimeMs: number;
}
