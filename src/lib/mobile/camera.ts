import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();

export interface CameraPhotoResult {
  webPath?: string;
  base64String?: string;
  format: string;
}

export async function takePhoto(): Promise<CameraPhotoResult> {
  if (!isNativeApp()) {
    // Fallback for web or throw error if only allowed in app
    console.warn('Camera is only supported in native app mode');
    throw new Error('Camera not supported in web mode');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    return {
      webPath: image.webPath,
      base64String: image.base64String, // Only if resultType is Base64
      format: image.format,
    };
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
}
