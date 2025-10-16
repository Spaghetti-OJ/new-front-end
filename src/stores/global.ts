import { defineStore } from "pinia";
import { promiseTimeout } from "@vueuse/core";
import { setServerErrorHandler } from "@/api/fetcher";

export const useGlobal = defineStore("global", {
  state: () => {
    return {
      isServerError: false,
    };
  },
  actions: {
    async onServerError() {
      this.$state.isServerError = true;
      await promiseTimeout(2400);
      this.$state.isServerError = false;
    },
  },
});

// Export a function to register the error handler with the store instance
export function registerGlobalErrorHandler(globalStore: ReturnType<typeof useGlobal>) {
  setServerErrorHandler(() => {
    if (typeof globalStore.onServerError === "function") {
      return globalStore.onServerError();
    }
    return undefined;
  });
}
