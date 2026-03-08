'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink, ArrowLeft } from "lucide-react";

interface LicenseEntry {
    id: string;
    name: string;
    version: string;
    description: string;
    repository: string;
    publisher: string;
    licenses: string;
    licenseText: string;
}

export default function OpenSourcePage() {
    const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/licenses.json')
            .then(res => res.json())
            .then(data => {
                setLicenses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load licenses:", err);
                setLoading(false);
            });
    }, []);

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    return (
        <div className="min-h-screen bg-cream font-sans text-warm-gray-700">
            <main className="max-w-4xl mx-auto px-6 py-20 bg-white rounded-3xl shadow-lg my-10">
                <header className="mb-12">
                    <div className="flex items-center gap-2 text-peach-600 hover:text-peach-700 font-semibold mb-6 transition-colors">
                        <ArrowLeft size={18} />
                        <Link href="/">Back to home</Link>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                        Open Source
                    </h1>
                    <p className="text-warm-gray-600 text-lg leading-relaxed">
                        RecipeKeeper is built with open source software. We would like to thank the developers and the open source community for their contributions.
                    </p>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <div className="py-12 text-center text-warm-gray-500 italic">
                            Processing licenses...
                        </div>
                    ) : (
                        licenses.map((lib) => (
                            <div
                                key={lib.id}
                                className="border border-warm-gray-100 rounded-2xl overflow-hidden hover:border-warm-gray-200 transition-colors"
                            >
                                <button
                                    onClick={() => toggleExpand(lib.id)}
                                    className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-warm-gray-50/50 transition-colors"
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-warm-gray-800 text-lg">
                                                {lib.name}
                                            </h3>
                                            <span className="text-xs font-medium text-warm-gray-400 bg-warm-gray-50 px-2 py-0.5 rounded-full">
                                                v{lib.version}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-peach-600">
                                                {lib.licenses}
                                            </span>
                                            {lib.publisher && (
                                                <span className="text-xs text-warm-gray-400">
                                                    by {lib.publisher}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-warm-gray-300">
                                        {expandedIds.has(lib.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </button>

                                {expandedIds.has(lib.id) && (
                                    <div className="px-6 pb-6 bg-warm-gray-50/30">
                                        {lib.description && (
                                            <p className="text-sm text-warm-gray-600 mb-4 leading-relaxed">
                                                {lib.description}
                                            </p>
                                        )}

                                        {lib.repository && (
                                            <a
                                                href={lib.repository}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-peach-600 hover:text-peach-700 font-medium mb-5 transition-colors"
                                            >
                                                <ExternalLink size={14} />
                                                View Repository
                                            </a>
                                        )}

                                        <div className="bg-white border border-warm-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto">
                                            <pre className="text-[10px] font-mono leading-tight text-warm-gray-500 whitespace-pre-wrap">
                                                {lib.licenseText}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <footer className="mt-16 pt-8 border-t border-warm-gray-100 flex flex-wrap gap-6 text-sm">
                    <Link href="/privacy" className="text-peach-600 hover:text-peach-700 font-semibold transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-peach-600 hover:text-peach-700 font-semibold transition-colors">
                        Terms of Service
                    </Link>
                </footer>
            </main>
        </div>
    );
}
