import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface WaitlistPrefill {
	/** Exact option from the "Preferred Programme or Subject" dropdown. */
	programme?: string;
	/** Exact option from the "Preferred Country or Region" dropdown. */
	region?: string;
}

export interface OpenRequest {
	id: number;
	prefill?: WaitlistPrefill;
}

interface WaitlistActions {
	/** Scroll to the inline waitlist form, optionally preselecting answers. */
	open: (prefill?: WaitlistPrefill) => void;
}

/*
 * Two contexts: every CTA reads the stable `open` action and never re-renders;
 * only the form subscribes to the latest open request.
 */
const ActionsContext = createContext<WaitlistActions | null>(null);
const RequestContext = createContext<OpenRequest | null>(null);

export function WaitlistProvider({ children }: { children: ReactNode }) {
	const [request, setRequest] = useState<OpenRequest | null>(null);

	const open = useCallback((prefill?: WaitlistPrefill) => {
		setRequest((prev) => ({ id: (prev?.id ?? 0) + 1, prefill }));
	}, []);

	const actions = useMemo(() => ({ open }), [open]);

	return (
		<ActionsContext.Provider value={actions}>
			<RequestContext.Provider value={request}>{children}</RequestContext.Provider>
		</ActionsContext.Provider>
	);
}

export function useWaitlist() {
	const ctx = useContext(ActionsContext);
	if (!ctx) throw new Error("useWaitlist must be used inside <WaitlistProvider>");
	return ctx;
}

export function useWaitlistRequest() {
	return useContext(RequestContext);
}
