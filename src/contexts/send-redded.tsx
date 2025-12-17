import { createContext, useContext, useEffect, useState } from "react";

type SendReddedContextValue = {
  sendRedded: boolean;
  setSendRedded: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const defValue = true;

const SendReddedContext = createContext<SendReddedContextValue | undefined>(undefined);

export function SendReddedProvider({ children }: { children: React.ReactNode }) {
  const [sendRedded, setSendRedded] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") {
        return defValue;
      }
      const raw = window.localStorage.getItem("sendRedded");
      return raw ? raw === "true" : defValue;
    } catch {
      return defValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sendRedded", String(sendRedded));
      }
    } catch {
      /* no-op */
    }
  }, [sendRedded]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "sendRedded") {
        const next = e.newValue ? e.newValue === "true" : defValue;
        setSendRedded(next);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  }, []);

  return (
    <SendReddedContext.Provider value={{ sendRedded, setSendRedded }}>
      {children}
    </SendReddedContext.Provider>
  );
}

export function useSendRedded() {
  const ctx = useContext(SendReddedContext);
  if (!ctx) {
    throw new Error("useSendRedded must be used within SendReddedProvider");
  }
  return ctx;
}
