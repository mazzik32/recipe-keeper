'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PACKAGES = [
    { id: 'pack_20', credits: 20, price: '5.00 CHF', description: 'Small Pack' },
    { id: 'pack_50', credits: 50, price: '10.00 CHF', description: 'Medium Pack' },
    { id: 'pack_100', credits: 100, price: '35.00 CHF', description: 'Large Pack' },
];

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handlePurchase = async (packageId: string) => {
        try {
            setLoadingId(packageId);
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    packageId,
                    returnUrl: window.location.href
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start checkout');
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Top Up Credits</DialogTitle>
                    <DialogDescription>
                        You need more credits to perform this action. Choose a package below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{pkg.credits} Scan Credits</h4>
                                    <p className="text-sm text-gray-500">{pkg.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">{pkg.price}</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={loadingId !== null}
                                    onClick={() => handlePurchase(pkg.id)}
                                >
                                    {loadingId === pkg.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Buy'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
