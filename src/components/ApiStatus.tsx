"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

export default function ApiStatus() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await apiClient.get<{ status: string }>("/ping/");
        if (!isMounted) return;
        if (res && typeof (res as { status?: string }).status === "string" && res.status === "ok") {
          setStatus("ok");
          setMessage("API connected");
        } else {
          setStatus("error");
          setMessage("Unexpected response");
        }
      } catch (e: unknown) {
        if (!isMounted) return;
        setStatus("error");
        const message = e instanceof Error ? e.message : "Request failed";
        setMessage(message);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const color = status === "ok" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-gray-400";

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span>
        {status === "idle" && "Checking API..."}
        {status === "ok" && message}
        {status === "error" && `API error: ${message}`}
      </span>
      {process.env["NEXT_PUBLIC_API_URL"] ? (
        <span className="ml-2 opacity-70">{process.env["NEXT_PUBLIC_API_URL"]}</span>
      ) : (
        <span className="ml-2 opacity-70">No API URL configured</span>
      )}
    </div>
  );
}
