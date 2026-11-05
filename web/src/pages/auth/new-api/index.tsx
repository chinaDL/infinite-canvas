import { App, Button, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { NEW_API_BASE_URL } from "@/constant/runtime-config";
import { initializeChannelModels } from "@/services/api/initialize-models";
import { exchangeNewApiCode } from "@/services/api/new-api";
import { useConfigStore } from "@/stores/use-config-store";

function base64url(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function NewApiStartPage() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [error, setError] = useState("");

    useEffect(() => {
        const parent = window.opener as Window | null;
        const abort = new AbortController();
        let active = true;
        let accepted = false;
        let ready = false;
        let verifier = "";
        let state = "";
        const cancel = () => {
            if (active && ready && parent && NEW_API_BASE_URL) parent.postMessage({ type: "canvas.cancel" }, NEW_API_BASE_URL);
            active = false;
            verifier = "";
            state = "";
            abort.abort();
            window.removeEventListener("message", receive);
            window.removeEventListener("pagehide", cancel);
        };
        const fail = () => {
            setError("画布接入失败，请从 New API 重新进入");
            cancel();
        };
        const receive = async (event: MessageEvent) => {
            if (!active || event.origin !== NEW_API_BASE_URL || event.source !== parent) return;
            const data = event.data;
            if (data?.type === "canvas.cancel") { fail(); return; }
            if (!state || data?.state !== state) return;
            if (data.type === "canvas.error") { fail(); return; }
            if (accepted || data.type !== "canvas.code" || typeof data.code !== "string" || !/^[A-Za-z0-9]{64}$/.test(data.code)) return;
            accepted = true;
            try {
                const key = await exchangeNewApiCode(data.code, verifier, abort.signal);
                if (!active) return;
                useConfigStore.getState().setApiKey(key);
                // Finish the handoff before model discovery: a model-list failure
                // must not undo a successfully delivered key.
                active = false;
                verifier = "";
                state = "";
                window.removeEventListener("message", receive);
                window.removeEventListener("pagehide", cancel);
                window.opener = null;
                void initializeChannelModels().catch(() => message.error("模型列表读取失败"));
                navigate("/canvas", { replace: true });
            } catch {
                if (active) fail();
            }
        };
        window.addEventListener("message", receive);
        window.addEventListener("pagehide", cancel);
        void (async () => {
            if (!parent || parent.closed || !NEW_API_BASE_URL) { fail(); return; }
            try {
                verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
                state = base64url(crypto.getRandomValues(new Uint8Array(32)));
                const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
                if (active) {
                    ready = true;
                    parent.postMessage({ type: "canvas.ready", state, code_challenge: challenge, code_challenge_method: "S256" }, NEW_API_BASE_URL);
                }
            } catch {
                if (active) fail();
            }
        })();
        return cancel;
    }, [message, navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            {error ? <div role="alert">{error}</div> : <Spin size="large" />}
            <Button type="text" onClick={() => navigate("/canvas", { replace: true })}>进入画布</Button>
        </div>
    );
}
