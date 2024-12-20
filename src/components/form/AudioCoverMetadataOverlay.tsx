import { HEN_CONTRACT_FA2 } from '@constants';
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
      const visualizerCanvas = visualizerRef.querySelector('canvas') as HTMLCanvasElement | null;
      const metadataCanvas = visualizerRef.querySelector('canvas:last-child') as HTMLCanvasElement | null;

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
  mimeType: string;
  style?: React.CSSProperties;
}

const MetadataOverlay: React.FC<MetadataOverlayProps> = ({ 
  title,
  artist,
  mimeType,
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
    ctx.fillText(`Title: ${title}`, 15, 25);
    ctx.fillText(`Wallet: ${artist}`, 15, 45);
    ctx.fillText(`${new Date().toISOString()}`, 15, 65);
    ctx.fillText(`${mimeType}`, 15, 85);
    ctx.fillText(`Mint Contract: ${HEN_CONTRACT_FA2} (HEN/TEIA)`, 15, 370);
    
  }, [title, artist, mimeType]);

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