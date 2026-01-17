"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageCropperProps {
    imageSrc: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (croppedImageBlob: Blob) => void;
    onSkip: () => void;
    aspectRatio?: number;
}

export function ImageCropper({
    imageSrc,
    isOpen,
    onClose,
    onConfirm,
    onSkip,
    aspectRatio = 16 / 9,
}: ImageCropperProps) {
    const { t } = useLanguage();
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onConfirm(croppedImage);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Edit Image</DialogTitle>
                    <DialogDescription>
                        Crop and adjust your image.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative flex-1 bg-black min-h-[300px]">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="p-6 pt-4 space-y-4 bg-background">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium w-12 text-center">Zoom</span>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <div className="flex-1" />
                        <Button variant="outline" onClick={onSkip} disabled={isProcessing}>
                            Skip (Use Original)
                        </Button>
                        <Button onClick={handleConfirm} disabled={isProcessing} className="bg-peach-500 hover:bg-peach-600">
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
