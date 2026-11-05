import { fetchChannelModels } from "@/services/api/image";
import { normalizeChannelModels, useConfigStore } from "@/stores/use-config-store";

export async function initializeChannelModels(): Promise<void> {
    const channel = useConfigStore.getState().config.channels[0];
    if (!channel.apiKey.trim()) return;
    const names = await fetchChannelModels(channel);
    const store = useConfigStore.getState();
    const current = store.config.channels[0];
    if (current.apiKey !== channel.apiKey) return;
    // Keep capability, script and selections; append newly discovered models.
    const models = normalizeChannelModels([...current.models, ...names]);
    store.updateConfig("channels", [{ ...current, models }]);
}
