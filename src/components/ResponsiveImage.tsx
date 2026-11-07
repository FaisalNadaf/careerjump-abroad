import type { CSSProperties } from "react";
import { asset } from "../config";

interface Props {
	/** Folder under /public/images, e.g. "programmes". */
	dir: string;
	/** Base file name; the largest width has no `-NNNw` suffix. */
	name: string;
	/** Generated widths in ascending order (see image-credits.json). */
	widths: number[];
	sizes: string;
	alt: string;
	width: number;
	height: number;
	loading?: "lazy" | "eager";
	fetchPriority?: "high" | "low" | "auto";
	className?: string;
	style?: CSSProperties;
}

/** <picture> with AVIF → WebP → JPEG fallbacks and a responsive srcset. */
export function ResponsiveImage({
	dir,
	name,
	widths,
	sizes,
	alt,
	width,
	height,
	loading = "lazy",
	fetchPriority,
	className,
	style,
}: Props) {
	const base = asset(`images/${dir}/${name}`);
	const last = widths.length - 1;
	const file = (w: number, i: number, ext: string) =>
		`${base}${i === last ? "" : `-${w}w`}.${ext}`;
	const srcSet = (ext: string) => widths.map((w, i) => `${file(w, i, ext)} ${w}w`).join(", ");

	return (
		<picture>
			<source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
			<source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
			<img
				src={file(widths[Math.min(1, last)], Math.min(1, last), "jpg")}
				srcSet={srcSet("jpg")}
				sizes={sizes}
				alt={alt}
				width={width}
				height={height}
				loading={loading}
				decoding="async"
				fetchPriority={fetchPriority}
				className={className}
				style={style}
			/>
		</picture>
	);
}
