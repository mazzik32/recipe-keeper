import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Hero image */}
      <Skeleton className="aspect-video w-full rounded-2xl" />

      {/* Meta info */}
      <div className="flex gap-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>

        {/* Steps */}
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-20 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
