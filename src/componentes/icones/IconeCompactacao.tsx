import * as React from "react";

export const CompactacaoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <ellipse cx={12} cy={5} rx={7} ry={2.5} />
        <path d="M5 5v13a7 2.5 0 0 0 14 0V5" />
        <path d="M2 20c0 1.3 4.5 2.3 10 2.3s10-1 10-2.3" />
        <line x1={3} y1={7} x2={3} y2={21} />
        <line x1={21} y1={7} x2={21} y2={21} />
    </svg>
);
