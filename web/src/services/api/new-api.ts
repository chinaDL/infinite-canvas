import { NEW_API_BASE_URL } from "@/constant/runtime-config";

export async function exchangeNewApiCode(code: string, verifier: string, signal: AbortSignal): Promise<string> {
    if (!NEW_API_BASE_URL) throw new Error("未配置 NEW_API_BASE_URL");
    const response = await fetch(`${NEW_API_BASE_URL}/api/canvas/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        body: JSON.stringify({ code, code_verifier: verifier }),
        signal,
    });
    if (!response.ok) throw new Error("画布接入失败，请从 New API 重新进入");
    const result = await response.json();
    const key = result?.data?.token?.key;
    if (!result.success || typeof key !== "string" || !key.trim()) throw new Error("画布接入失败，请从 New API 重新进入");
    return key.trim();
}
