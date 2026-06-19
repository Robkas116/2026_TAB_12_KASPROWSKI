"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080a] text-white">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "#8b5cf6",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-sm font-medium text-gray-400">
          Przekierowywanie...
        </p>
      </div>
    </div>
  );
}
