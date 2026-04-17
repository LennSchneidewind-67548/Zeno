"use client";

import { useRouter } from "next/navigation";

export default function TaskDetailPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      <div className="flex items-center px-6 py-4">
        <button
          onClick={() => router.back()}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
