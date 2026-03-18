import { createContext, useContext } from "react";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "VMS Core";

export const AppContext = createContext({ appName });

export function useAppContext() {
    return useContext(AppContext);
}
