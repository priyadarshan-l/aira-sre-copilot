import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

export function PlannerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="9"
        y="3"
        width="6"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RCAIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 8v6M8 11h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FixerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ValidatorIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3l1.5 1.5L15 3l1.5 1.5L18 3v3l1.5 1.5L18 9l1.5 1.5L18 12v3l1.5 1.5L18 18l1.5 1.5L18 21h-3l-1.5-1.5L12 21l-1.5-1.5L9 21H6l-1.5-1.5L3 18l1.5-1.5L3 15v-3l1.5-1.5L3 9 4.5 7.5 3 6V3l1.5 1.5L6 3l1.5 1.5L9 3z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function IncidentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <path
        d="M12 9v4M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ServerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <rect x="2" y="3" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="13" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <circle cx="6" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function NetworkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7l4 3M14 9l4-2M6 17l4-3M14 15l4 2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function MemoryIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 4V2M15 4V2M9 22v-2M15 22v-2M4 9H2M4 15H2M22 9h-2M22 15h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
