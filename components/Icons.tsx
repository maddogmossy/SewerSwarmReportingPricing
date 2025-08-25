// components/Icons.tsx
import * as React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export function DashboardIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10 7v-8h8v8h-8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function CogIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M10 2h4l.6 2.4a7.9 7.9 0 0 1 2.1 1.2l2.5-.7 2 3.5-2 1.7a7.9 7.9 0 0 1 0 2.4l2 1.7-2 3.5-2.5-.7a7.9 7.9 0 0 1-2.1 1.2L14 22h-4l-.6-2.4a7.9 7.9 0 0 1-2.1-1.2l-2.5.7-2-3.5 2-1.7a7.9 7.9 0 0 1 0-2.4l-2-1.7 2-3.5 2.5.7a7.9 7.9 0 0 1 2.1-1.2L10 2Zm2 6a4 4 0 1 0 .001 8.001A4 4 0 0 0 12 8Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SignOutIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M15 17l5-5-5-5M9 12h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}