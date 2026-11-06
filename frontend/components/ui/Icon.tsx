import type { SVGProps } from "react";

/**
 * Small inline icon set (stroke icons, 24px grid) so the MVP needs no icon
 * dependency. Swap for lucide-react later if the team adds it.
 */
export type IconName =
  | "shield"
  | "search"
  | "alert"
  | "check"
  | "lock"
  | "eye-off"
  | "link-off"
  | "sparkles"
  | "list"
  | "arrow-right"
  | "mail"
  | "message"
  | "phone"
  | "quote"
  | "refresh"
  | "info"
  | "menu"
  | "x"
  | "server"
  | "scale";

const PATHS: Record<IconName, string> = {
  shield: "M12 3l7 3v5c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V6l7-3z",
  search: "M11 4a7 7 0 110 14 7 7 0 010-14zm9 16l-4-4",
  alert: "M12 4l9 16H3L12 4zm0 6v4m0 3h.01",
  check: "M5 12.5l4.5 4.5L19 7.5",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
  "eye-off":
    "M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c5 0 9 6 9 6a16 16 0 01-2.6 3.2M6.5 7.6C4.4 9.1 3 12 3 12s4 6 9 6c1.4 0 2.7-.4 3.9-1M10 10.2a2.5 2.5 0 003.8 3.3",
  "link-off": "M9 15l-1.5 1.5a3.5 3.5 0 01-5-5L4 10m6-6l1.5-1.5a3.5 3.5 0 015 5L15 9M3 3l18 18",
  sparkles: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zm6 11l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  "arrow-right": "M5 12h14m-5-5l5 5-5 5",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  message: "M5 5h14v10H9l-4 4V5z",
  phone: "M8 3h8v18H8zM11 18h2",
  quote: "M7 10h3v6H5v-4a5 5 0 013-4.6M16 10h3v6h-5v-4a5 5 0 013-4.6",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 5v6h-6",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-12h.01M11 12h1v5h1",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  server: "M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01",
  scale: "M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a3 3 0 005 0L5 8zm14 0l-2.5 6a3 3 0 005 0L19 8z",
};

export function Icon({ name, className, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
