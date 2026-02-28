import { WhiskLoader } from "@/components/shared/WhiskLoader";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <WhiskLoader />
    </div>
  );
}
