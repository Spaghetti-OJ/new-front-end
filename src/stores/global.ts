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

setServerErrorHandler(() => {
  const global = useGlobal();
  if (typeof global.onServerError === "function") {
    return global.onServerError();
  }
  return undefined;
});
