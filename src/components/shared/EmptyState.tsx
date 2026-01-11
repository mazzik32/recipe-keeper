import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon = "📖",
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-peach-100 flex items-center justify-center">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="font-display text-xl text-warm-gray-700 mb-2">{title}</h3>
      <p className="text-warm-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700">
          <Link href={actionHref}>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
