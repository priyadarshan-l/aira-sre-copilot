import { cn } from "@/lib/utils";

interface AiraIconProps {
  className?: string;
}

export default function AiraIcon({ className }: AiraIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
    >
      {/* Outer ring - represents autonomous monitoring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        className="opacity-40"
      />
      
      {/* Middle ring - incident detection */}
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-60"
      />
      
      {/* Core - AI brain */}
      <circle
        cx="24"
        cy="24"
        r="8"
        fill="currentColor"
        className="opacity-90"
      />
      
      {/* Neural connections - 4 agents */}
      <path
        d="M24 8 L24 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 32 L24 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 24 L16 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 24 L40 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Agent nodes */}
      <circle cx="24" cy="6" r="3" fill="currentColor" />
      <circle cx="24" cy="42" r="3" fill="currentColor" />
      <circle cx="6" cy="24" r="3" fill="currentColor" />
      <circle cx="42" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
