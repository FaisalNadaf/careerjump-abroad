import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Adds canonical / og:url and absolute social-image URLs only when a real
 * production URL is configured (VITE_SITE_URL). Nothing is invented otherwise.
 */
function siteMeta(siteUrl: string): Plugin {
	const base = siteUrl.replace(/\/+$/, "");
	return {
		name: "careerjump-site-meta",
		transformIndexHtml(html) {
			if (!base) return html;
			const abs = (path: string) => `${base}${path}`;
			return html
				.replace(
					'<meta property="og:image" content="/og-image.jpg" />',
					`<meta property="og:image" content="${abs("/og-image.jpg")}" />`,
				)
				.replace(
					'<meta name="twitter:image" content="/og-image.jpg" />',
					`<meta name="twitter:image" content="${abs("/og-image.jpg")}" />`,
				)
				.replace(
					"</title>",
					`</title>\n\t\t<link rel="canonical" href="${base}/" />\n\t\t<meta property="og:url" content="${base}/" />`,
				);
		},
	};
}

/**
 * With a production URL (VITE_SITE_URL), the build writes sitemap.xml and adds
 * its absolute Sitemap line to robots.txt. Without one, public/robots.txt ships
 * unchanged, because a Sitemap line must be an absolute URL.
 */
function crawlerFiles(siteUrl: string): Plugin {
	const base = siteUrl.trim().replace(/\/+$/, "");
	return {
		name: "careerjump-crawler-files",
		apply: "build",
		// public/ is copied into the output folder before the bundle is written,
		// so robots.txt is already there.
		async writeBundle({ dir }) {
			if (!base || !dir) return;
			if (!/^https?:\/\/[^/?#]+$/i.test(base)) {
				this.warn(`VITE_SITE_URL "${base}" is not an origin like https://www.example.com; skipped sitemap.xml.`);
				return;
			}
			const today = new Date().toISOString().slice(0, 10);
			const sitemap = [
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
				"\t<url>",
				`\t\t<loc>${base}/</loc>`,
				`\t\t<lastmod>${today}</lastmod>`,
				"\t</url>",
				"</urlset>",
				"",
			].join("\n");
			await this.fs.writeFile(`${dir}/sitemap.xml`, sitemap);
			await this.fs.appendFile(`${dir}/robots.txt`, `\nSitemap: ${base}/sitemap.xml\n`);
		},
	};
}

async function sha256Base64(text: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

/**
 * Production-only Content-Security-Policy (as a <meta> tag, so it works on any
 * static host). Inline scripts are allowed by exact SHA-256 hash; no
 * 'unsafe-inline'. connect-src is derived from the configured waitlist endpoint.
 * Headers a <meta> CSP cannot express (frame-ancestors, HSTS, nosniff) belong
 * on the host: see docs/deployment-security.md.
 */
function contentSecurityPolicy(endpoint: string): Plugin {
	return {
		name: "careerjump-csp",
		apply: "build",
		transformIndexHtml: {
			order: "post",
			async handler(html) {
				const inlineScripts = [
					...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
				].map((m) => m[1]);
				// Browsers hash the parsed script text, where CRLF/CR are normalised to LF.
				const hashes = await Promise.all(
					inlineScripts.map((body) => sha256Base64(body.replace(/\r\n?/g, "\n"))),
				);

				const connect = new Set(["'self'"]);
				if (endpoint) {
					try {
						const url = new URL(endpoint);
						connect.add(url.origin);
						// Apps Script answers via a redirect to googleusercontent.com.
						if (url.hostname === "script.google.com") connect.add("https://script.googleusercontent.com");
					} catch {
						/* invalid endpoint: the form reports "not configured" at runtime */
					}
				}

				const policy = [
					"default-src 'self'",
					["script-src 'self'", ...hashes.map((h) => `'sha256-${h}'`)].join(" "),
					"style-src 'self'",
					"font-src 'self'",
					"img-src 'self' data:",
					"media-src 'self'",
					`connect-src ${[...connect].join(" ")}`,
					"object-src 'none'",
					"base-uri 'self'",
					"form-action 'self'",
				].join("; ");

				return html.replace(
					/(<meta charset="UTF-8" \/>)/,
					`$1\n\t\t<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
				);
			},
		},
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "VITE_");
	return {
		plugins: [
			react(),
			siteMeta(env.VITE_SITE_URL ?? ""),
			crawlerFiles(env.VITE_SITE_URL ?? ""),
			contentSecurityPolicy((env.VITE_WAITLIST_ENDPOINT ?? "").trim()),
		],
		server: { port: 5173 },
		build: { target: "es2020", cssCodeSplit: false },
	};
});
