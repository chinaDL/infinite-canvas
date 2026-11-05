import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App } from "antd";

import { initializeChannelModels } from "@/services/api/initialize-models";
import { usePromptSourceScheduler } from "@/hooks/use-prompt-source-scheduler";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const initialized = useRef(false);
    usePromptSourceScheduler();

    useEffect(() => {
        if (initialized.current || window.location.pathname === "/auth/new-api/start") return;
        initialized.current = true;
        void initializeChannelModels().catch(() => message.error("模型列表读取失败"));
    }, [message]);

    return <>{children}</>;
}
