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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Loader2, RotateCw } from "lucide-react";
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
    aspectRatio: initialAspectRatio = 16 / 9,
}: ImageCropperProps) {
    const { t } = useLanguage();
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(initialAspectRatio);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
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
            <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-[700px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Edit Image</DialogTitle>
                    <DialogDescription>
                        Crop, rotate, and adjust your image.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative flex-1 bg-black min-h-[300px]">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                    />
                </div>

                <div className="p-6 pt-4 space-y-4 bg-background">
                    {/* Aspect Ratio Tabs */}
                    <div className="flex justify-center">
                        <Tabs defaultValue={String(initialAspectRatio)} onValueChange={(v) => setAspect(Number(v))}>
                            <TabsList>
                                <TabsTrigger value={String(16 / 9)}>16:9</TabsTrigger>
                                <TabsTrigger value={String(4 / 3)}>4:3</TabsTrigger>
                                <TabsTrigger value={String(1)}>1:1</TabsTrigger>
                                <TabsTrigger value={String(3 / 4)}>3:4</TabsTrigger>
                                <TabsTrigger value={String(9 / 16)}>9:16</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Controls */}
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium w-16">Zoom</span>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(value) => setZoom(value[0])}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <RotateCw className="w-4 h-4 text-warm-gray-500" />
                            <span className="text-sm font-medium w-12">Rotate</span>
                            <Slider
                                value={[rotation]}
                                min={0}
                                max={360}
                                step={1}
                                onValueChange={(value) => setRotation(value[0])}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
