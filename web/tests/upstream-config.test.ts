import { afterAll, expect, test, mock } from "bun:test";

const values = new Map<string, string>();
const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage } });
afterAll(() => {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
});
const { CONFIG_STORE_KEY, defaultConfig, restoreAiConfig, serializeAiConfig, useConfigStore, resolveModelRequestConfig, buildApiUrl } = await import("../src/stores/use-config-store");
const { NEW_API_BASE_URL } = await import("../src/constant/runtime-config");

test("import only restores the single key and models; injected addresses and channels cannot redirect requests", () => {
    const imported = restoreAiConfig(JSON.parse(JSON.stringify({
        baseUrl: "https://evil.example.com", apiFormat: "gemini",
        channels: [{ id: "evil", baseUrl: "https://evil.example.com", apiKey: "foreign" }],
        channel: { apiKey: "chosen", baseUrl: "https://evil.example.com", models: [{ name: "model", capability: "image", baseUrl: "https://evil.example.com" }] },
    })));
    expect(imported.channels).toHaveLength(1);
    expect(imported.channels[0].apiKey).toBe("chosen");
    expect(imported.channels[0].id).toBe("default");
    expect(resolveModelRequestConfig(imported, "default::model").baseUrl).toBe(NEW_API_BASE_URL);
    expect(buildApiUrl("https://evil.example.com", "/models")).toBe(`${NEW_API_BASE_URL}/v1/models`);
    expect(JSON.stringify(serializeAiConfig(imported))).not.toContain("baseUrl");
    expect(JSON.stringify(serializeAiConfig(imported))).not.toContain("evil.example.com");
});
test("local save and restore keep the key without persisting an upstream address", async () => {
    useConfigStore.getState().setApiKey("current-key");
    const saved = values.get(CONFIG_STORE_KEY)!;
    expect(saved).toContain("current-key");
    expect(saved).not.toContain("baseUrl");
    const data = JSON.parse(saved);
    data.state.config.baseUrl = "https://evil.example.com";
    values.set(CONFIG_STORE_KEY, JSON.stringify(data));
    await useConfigStore.persist.rehydrate();
    expect(useConfigStore.getState().config.baseUrl).toBe(NEW_API_BASE_URL);
    expect(useConfigStore.getState().config.channels[0].apiKey).toBe("current-key");
});
test("normal configuration changes cannot add channels or edit the deployment address", () => {
    useConfigStore.getState().updateConfig("baseUrl", "https://evil.example.com");
    useConfigStore.getState().updateConfig("channels", [defaultConfig.channels[0], { ...defaultConfig.channels[0], id: "extra" }]);
    expect(useConfigStore.getState().config.baseUrl).toBe(NEW_API_BASE_URL);
    expect(useConfigStore.getState().config.channels).toHaveLength(1);
});

const fetchModels = mock(async () => ["new-image-model"]);
mock.module("../src/services/api/image", () => ({ fetchChannelModels: fetchModels }));
const { initializeChannelModels } = await import("../src/services/api/initialize-models");
test("opening without a key never fetches models, while a key fetch preserves model scripts and selections", async () => {
    useConfigStore.getState().setApiKey("");
    await initializeChannelModels();
    expect(fetchModels).not.toHaveBeenCalled();
    useConfigStore.getState().updateConfig("channels", [{ ...defaultConfig.channels[0], apiKey: "chosen", models: [{ name: "custom", capability: "video", script: "custom-script" }] }]);
    useConfigStore.getState().updateConfig("videoModel", "default::custom");
    await initializeChannelModels();
    expect(fetchModels).toHaveBeenCalledTimes(1);
    expect(useConfigStore.getState().config.channels[0].models).toContainEqual({ name: "custom", capability: "video", script: "custom-script" });
    expect(useConfigStore.getState().config.videoModel).toBe("default::custom");
});

test("a model response for a replaced key cannot alter the current model list", async () => {
    let finish!: (models: string[]) => void;
    fetchModels.mockImplementationOnce(() => new Promise<string[]>((resolve) => { finish = resolve; }));
    useConfigStore.getState().setApiKey("previous-key");
    const pending = initializeChannelModels();
    useConfigStore.getState().setApiKey("next-key");
    finish(["previous-key-only-model"]);
    await pending;
    expect(useConfigStore.getState().config.channels[0].models.some((model) => model.name === "previous-key-only-model")).toBe(false);
});

const { exchangeNewApiCode } = await import("../src/services/api/new-api");
test("code exchange uses only the fixed endpoint with no cookies or redirects and returns only the selected key", async () => {
    const originalFetch = globalThis.fetch;
    let request: RequestInit | undefined;
    let target: unknown;
    globalThis.fetch = mock(async (url, init) => {
        target = url;
        request = init;
        return Response.json({ success: true, data: { token: { key: "chosen-key" }, user: { id: 1 } } });
    }) as typeof fetch;
    try {
        const key = await exchangeNewApiCode("c".repeat(64), "v".repeat(43), new AbortController().signal);
        expect(key).toBe("chosen-key");
        expect(target).toBe(`${NEW_API_BASE_URL}/api/canvas/exchange`);
        expect(request?.credentials).toBe("omit");
        expect(request?.redirect).toBe("error");
        expect(request?.cache).toBe("no-store");
        expect(request?.method).toBe("POST");
    } finally { globalThis.fetch = originalFetch; }
});
