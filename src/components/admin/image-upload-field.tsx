"use client";

import * as React from "react";
import Image from "next/image";
import { v4 as uuid } from "uuid";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
  mimeType?: string;
  originalName?: string;
  size?: number;
}

type UploadStatus = "idle" | "uploading" | "error" | "success";

interface UploadItem {
  id: string;
  file?: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  response?: UploadedImage;
  isExisting?: boolean;
}

interface ImageUploadFieldProps {
  label?: string;
  helperText?: string;
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  endpoint?: string;
  accept?: string;
}

const defaultAccept = "image/*";

export function ImageUploadField({
  label = "Images",
  helperText = "Add up to 6 images",
  value = [],
  onChange,
  maxFiles = 6,
  endpoint = "/uploads",
  accept = defaultAccept,
}: ImageUploadFieldProps) {
  const [items, setItems] = React.useState<UploadItem[]>(() =>
    value.map((image) => ({
      id: `existing-${crypto.randomUUID()}`,
      previewUrl: image.url,
      status: "success",
      progress: 100,
      response: image,
      isExisting: true,
    }))
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const successItems = items.filter((item) => item.status === "success" && item.response);
    const images = successItems.map((item) => item.response!) as UploadedImage[];
    onChange?.(images);
  }, [items, onChange]);

  React.useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (!item.isExisting && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const remainingSlots = Math.max(0, maxFiles - items.length);
    const acceptedFiles = Array.from(files).slice(0, remainingSlots);

    const newItems: UploadItem[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "idle",
      progress: 0,
    }));

    if (newItems.length === 0) {
      return;
    }

    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      if (item.file) {
        startUpload(item.id, item.file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const replaceItem = React.useCallback((id: string, updater: (item: UploadItem) => UploadItem) => {
    setItems((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next;
    });
  }, []);

  const startUpload = React.useCallback(
    async (id: string, file: File) => {
      replaceItem(id, (item) => ({ ...item, status: "uploading", progress: 0, error: undefined }));

      try {
        const response = await apiClient.uploadFile(
          endpoint,
          file,
          (progress) => {
            replaceItem(id, (item) => ({ ...item, progress }));
          },
          { retryDelays: [300, 600, 1200], attempts: 3 }
        );

        const data = (response?.data ?? response) as UploadedImage;

        replaceItem(id, (item) => ({
          ...item,
          status: "success",
          progress: 100,
          response: data,
          error: undefined,
        }));
      } catch (error: any) {
        const message = error?.message ?? "Upload failed";
        replaceItem(id, (item) => ({
          ...item,
          status: "error",
          error: message,
        }));
      }
    },
    [endpoint, replaceItem]
  );

  const retryUpload = React.useCallback(
    (id: string) => {
      const item = items.find((current) => current.id === id);
      if (!item || !item.file) return;
      startUpload(id, item.file);
    },
    [items, startUpload]
  );

  return (
    <div className="space-y-3">
      {label ? <Label className="text-sm font-medium text-gray-900">{label}</Label> : null}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleSelectFiles}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={items.length >= maxFiles}
        >
          {items.length >= maxFiles ? "Maximum reached" : "Add images"}
        </Button>
        {helperText ? <p className="mt-1 text-xs text-muted-foreground">{helperText}</p> : null}
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "relative flex gap-3 rounded-lg border border-dashed p-3 transition",
                item.status === "error" && "border-red-400 bg-red-50",
                item.status === "uploading" && "border-blue-300 bg-blue-50"
              )}
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={item.response?.originalName ?? item.file?.name ?? "Upload preview"}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    Preview
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1">
                    {item.response?.originalName ?? item.file?.name ?? "Image"}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Remove
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge
                    variant={
                      item.status === "success"
                        ? "default"
                        : item.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.status === "success" && "Uploaded"}
                    {item.status === "uploading" && `Uploading ${Math.round(item.progress)}%`}
                    {item.status === "error" && "Upload failed"}
                    {item.status === "idle" && "Pending"}
                  </Badge>

                  {item.response?.width && item.response?.height ? (
                    <span>
                      {item.response.width}×{item.response.height}
                    </span>
                  ) : null}

                  {item.file?.size ? (
                    <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                  ) : null}
                </div>

                {item.error ? (
                  <div className="text-xs text-red-600">
                    {item.error}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-6 px-2"
                      onClick={() => retryUpload(item.id)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
