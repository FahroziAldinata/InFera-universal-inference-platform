import { forwardRef } from 'react';

export const DetectionTooltip = forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <div
            ref={ref}
            className="detection-tooltip"
            style={{
                display: 'none',
                position: 'absolute',
                pointerEvents: 'none',
            }}
        >
            <div className="tooltip-title" id="tooltip-class-name">
                Label
            </div>
            <div className="tooltip-details" id="tooltip-coords">
                Coords
            </div>
        </div>
    );
});

DetectionTooltip.displayName = 'DetectionTooltip';
