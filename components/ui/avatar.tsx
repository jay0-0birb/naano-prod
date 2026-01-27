"use client";

import Image from "next/image";
import { Building2, User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  type?: "user" | "company";
  className?: string;
}

const SIZES = {
  sm: { container: "w-8 h-8", icon: "w-4 h-4", text: "text-xs" },
  md: { container: "w-10 h-10", icon: "w-5 h-5", text: "text-sm" },
  lg: { container: "w-14 h-14", icon: "w-7 h-7", text: "text-base" },
};

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 56,
};

export default function Avatar({
  src,
  alt,
  size = "md",
  type = "user",
  className = "",
}: AvatarProps) {
  const sizeClasses = SIZES[size];
  const sizePx = SIZE_PX[size];

  // Get initials from alt text
  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <div
        className={`${sizeClasses.container} rounded-xl overflow-hidden relative ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          width={sizePx}
          height={sizePx}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  // Fallback with icon or initials
  const bgGradient = "bg-blue-50";

  const iconColor = "text-blue-600";

  return (
    <div
      className={`${sizeClasses.container} rounded-xl ${bgGradient} border border-gray-200 flex items-center justify-center ${className}`}
    >
      {initials ? (
        <span className={`font-medium ${iconColor} ${sizeClasses.text}`}>
          {initials}
        </span>
      ) : type === "company" ? (
        <Building2 className={`${sizeClasses.icon} ${iconColor}`} />
      ) : (
        <User className={`${sizeClasses.icon} ${iconColor}`} />
      )}
    </div>
  );
}
