"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createUserMutationOptions } from "@/lib/api/user/user-queries";

interface UserIdContextValue {
  userId: string;
  isReady: boolean;
}

const UserIdContext = createContext<UserIdContextValue>({
  userId: "",
  isReady: false,
});

export function useUserId(): UserIdContextValue {
  return useContext(UserIdContext);
}

export function UserIdProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("userId") ?? "";
  });
  const mutation = useMutation(createUserMutationOptions());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (userId) return;
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        localStorage.setItem("userId", data.id);
        setUserId(data.id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserIdContext.Provider value={{ userId, isReady: !!userId }}>
      {children}
    </UserIdContext.Provider>
  );
}
