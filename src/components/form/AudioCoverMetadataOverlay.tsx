import React, { useEffect, useRef } from 'react';

export const combineVisualizerWithMetadata = async (
  visualizerRef: HTMLDivElement,
  fileValue: {
    artifact?: {
      name?: string;
      size?: number;
      mimeType?: string;
    };
  }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new canvas for the final image
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = 618;  // Match the AudioVisualizer dimensions
      finalCanvas.height = 382;
      
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Fill with black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Get both canvas elements
      const visualizerCanvas = visualizerRef.querySelector('canvas');
      const metadataCanvas = visualizerRef.querySelector('canvas:last-child');

      if (!visualizerCanvas || !metadataCanvas) {
        throw new Error('Could not find canvas elements');
      }

      // First draw the visualizer
      ctx.drawImage(visualizerCanvas, 0, 0);
      
      // Then draw the metadata canvas on top
      ctx.drawImage(metadataCanvas, 0, 0);

      finalCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
};

interface MetadataOverlayProps {
  title: string;
  artist: string;
  style?: React.CSSProperties;
}

const MetadataOverlay: React.FC<MetadataOverlayProps> = ({ 
  title,
  artist,
  style 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.globalAlpha = 0.8;

    // Draw metadata
    ctx.fillText(`Title: ${title}`, 20, 30);
    ctx.fillText(`Artist: ${artist}`, 20, 55);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
    
  }, [title, artist]);

  return (
    <canvas
      ref={canvasRef}
      width={618}
      height={382}
      style={{ ...style, pointerEvents: 'none' }}
    />
  );
};

export default MetadataOverlay;