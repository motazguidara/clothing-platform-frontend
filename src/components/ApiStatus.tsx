"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApiStatus() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get("/ping/");
        if (!isMounted) return;
        if (res.data?.status === "ok") {
          setStatus("ok");
          setMessage("API connected");
        } else {
          setStatus("error");
          setMessage("Unexpected response");
        }
      } catch (e: any) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(e?.message || "Request failed");
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
      {process.env.NEXT_PUBLIC_API_URL ? (
        <span className="ml-2 opacity-70">{process.env.NEXT_PUBLIC_API_URL}</span>
      ) : (
        <span className="ml-2 opacity-70">No API URL configured</span>
      )}
    </div>
  );
}
