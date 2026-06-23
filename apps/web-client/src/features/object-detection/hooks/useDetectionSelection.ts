import { useEffect } from 'react';
import { useDetectionStore } from '../store/detectionStore';

export function useDetectionSelection() {
    const {
        detections,
        selectedDetectionId,
        hoveredDetectionId,
        setSelectedDetectionId,
    } = useDetectionStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (detections.length === 0) return;

            // Only listen to keyboard shortcuts if the user is not typing in input fields
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            const currentIndex = detections.findIndex((d) => d.id === selectedDetectionId);

            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % detections.length;
                    const nextDet = detections[nextIndex];
                    if (nextDet) setSelectedDetectionId(nextDet.id || null);
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    const nextIndex = currentIndex === -1 ? detections.length - 1 : (currentIndex - 1 + detections.length) % detections.length;
                    const nextDet = detections[nextIndex];
                    if (nextDet) setSelectedDetectionId(nextDet.id || null);
                    break;
                }
                case 'Home': {
                    e.preventDefault();
                    const firstDet = detections[0];
                    if (firstDet) setSelectedDetectionId(firstDet.id || null);
                    break;
                }
                case 'End': {
                    e.preventDefault();
                    const lastDet = detections[detections.length - 1];
                    if (lastDet) setSelectedDetectionId(lastDet.id || null);
                    break;
                }
                case 'PageDown': {
                    e.preventDefault();
                    const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 5, detections.length - 1);
                    const nextDet = detections[nextIndex];
                    if (nextDet) setSelectedDetectionId(nextDet.id || null);
                    break;
                }
                case 'PageUp': {
                    e.preventDefault();
                    const nextIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 5, 0);
                    const nextDet = detections[nextIndex];
                    if (nextDet) setSelectedDetectionId(nextDet.id || null);
                    break;
                }
                case 'Escape': {
                    e.preventDefault();
                    setSelectedDetectionId(null);
                    break;
                }
                case 'Enter': {
                    if (hoveredDetectionId) {
                        e.preventDefault();
                        setSelectedDetectionId(hoveredDetectionId);
                    }
                    break;
                }
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [detections, selectedDetectionId, hoveredDetectionId, setSelectedDetectionId]);
}
