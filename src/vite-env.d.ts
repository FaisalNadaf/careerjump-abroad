/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_WAITLIST_ENDPOINT?: string;
	readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
