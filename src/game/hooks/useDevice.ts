import { useEffect, useState, useCallback } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isLandscape: false,
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const isLandscape = width > height;
  const isMobile = width <= 768 || /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) && !isMobile;

  return {
    isMobile,
    isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
  };
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

export function useLandscapeLock(): { needsRotation: boolean; requestLandscape: () => Promise<void> } {
  const { isMobile, isLandscape } = useDeviceInfo();

  const requestLandscape = useCallback(async () => {
    try {
      const screenOrientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (screenOrientation.lock) {
        await screenOrientation.lock('landscape');
      }
    } catch (e) {
      console.warn('Could not lock orientation:', e);
    }
  }, []);

  return {
    needsRotation: isMobile && !isLandscape,
    requestLandscape,
  };
}

export function getOptimalCanvasSize(deviceInfo: DeviceInfo, maxDimension = 1920): { width: number; height: number } {
  const { screenWidth, screenHeight, pixelRatio, isMobile, isLandscape } = deviceInfo;

  if (isMobile) {
    const orientationWidth = isLandscape ? screenWidth : screenHeight;
    const orientationHeight = isLandscape ? screenHeight : screenWidth;

    const scale = Math.min(1, maxDimension / Math.max(orientationWidth, orientationHeight) / pixelRatio);

    return {
      width: Math.floor(orientationWidth * pixelRatio * scale),
      height: Math.floor(orientationHeight * pixelRatio * scale),
    };
  }

  return {
    width: Math.floor(screenWidth * pixelRatio),
    height: Math.floor(screenHeight * pixelRatio),
  };
}