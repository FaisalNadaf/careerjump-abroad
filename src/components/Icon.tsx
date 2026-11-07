import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			{...rest}>
			{children}
		</svg>
	);
}

export const ArrowRight = (p: IconProps) => (
	<Svg {...p}>
		<path d="M5 12h14M13 6l6 6-6 6" />
	</Svg>
);
export const ArrowUpRight = (p: IconProps) => (
	<Svg {...p}>
		<path d="M7 17 17 7M9 7h8v8" />
	</Svg>
);
export const ArrowDown = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 5v14M6 13l6 6 6-6" />
	</Svg>
);
export const ArrowUp = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 19V5M6 11l6-6 6 6" />
	</Svg>
);
export const ChevronLeft = (p: IconProps) => (
	<Svg {...p}>
		<path d="m15 18-6-6 6-6" />
	</Svg>
);
export const ChevronRight = (p: IconProps) => (
	<Svg {...p}>
		<path d="m9 18 6-6-6-6" />
	</Svg>
);
export const ChevronDown = (p: IconProps) => (
	<Svg {...p}>
		<path d="m6 9 6 6 6-6" />
	</Svg>
);
export const Close = (p: IconProps) => (
	<Svg {...p}>
		<path d="M18 6 6 18M6 6l12 12" />
	</Svg>
);
export const Check = (p: IconProps) => (
	<Svg {...p}>
		<path d="M20 6 9 17l-5-5" />
	</Svg>
);
export const Pause = (p: IconProps) => (
	<Svg {...p}>
		<path d="M9 5v14M15 5v14" />
	</Svg>
);
export const Play = (p: IconProps) => (
	<Svg {...p}>
		<path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
	</Svg>
);
export const Pin = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
		<circle cx="12" cy="9.5" r="2.5" />
	</Svg>
);
export const Plane = (p: IconProps) => (
	<Svg {...p}>
		<path
			d="M21 15.5v-1.8l-8-5V3.6a1.6 1.6 0 0 0-3.2 0v5.1l-8 5v1.8l8-2.5v5l-2.4 1.8V21L12 20l4.6 1v-1.2L14.2 18v-5l6.8 2.5Z"
			fill="currentColor"
			stroke="none"
		/>
	</Svg>
);
export const TrendingUp = (p: IconProps) => (
	<Svg {...p}>
		<path d="m3 17 6-6 4 4 8-8" />
		<path d="M15 7h6v6" />
	</Svg>
);
export const Users = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="9" cy="8" r="3.2" />
		<path d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
		<path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.8.7 3 2.5 3 5.2" />
	</Svg>
);
export const Globe = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
	</Svg>
);
export const Sparkles = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6-5.7-1.8L10.2 9 12 3.5Z" />
		<path d="M19 3v3.5M17.2 4.8h3.6" />
	</Svg>
);
export const Plus = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 5v14M5 12h14" />
	</Svg>
);
export const GraduationCap = (p: IconProps) => (
	<Svg {...p}>
		<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
		<path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
		<path d="M22 9.5V15" />
	</Svg>
);
export const ShieldCheck = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 3 5 6v5.5c0 4.3 3 8.1 7 9.5 4-1.4 7-5.2 7-9.5V6l-7-3Z" />
		<path d="m9 12 2 2 4-4" />
	</Svg>
);
export const Info = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	</Svg>
);
export const AlertCircle = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7.5v5.5M12 16.5h.01" />
	</Svg>
);
export const Spinner = (p: IconProps) => (
	<Svg {...p} className="spinner">
		<path d="M12 3a9 9 0 1 0 9 9" />
	</Svg>
);
