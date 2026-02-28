"use client";

import React from "react";
import Lottie from "lottie-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";

// Import the animation JSON statically
import animationData from "../../../assets/recipekeeper.json";

interface WhiskLoaderProps {
    isAnalyzing?: boolean;
}

export function WhiskLoader({ isAnalyzing = false }: WhiskLoaderProps) {
    const { t } = useLanguage();
    const loadingMessage = useLoadingMessages(3500);

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="w-48 h-48 -mb-4">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                />
            </div>

            <div className="h-12 relative flex items-center justify-center w-full max-w-sm">
                <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                        <motion.p
                            key={loadingMessage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="text-warm-gray-500 font-medium text-center text-lg absolute"
                        >
                            {loadingMessage}
                        </motion.p>
                    ) : (
                        <motion.p
                            key="default-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-warm-gray-500 font-medium text-center text-lg absolute"
                        >
                            {t.common.loading}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
