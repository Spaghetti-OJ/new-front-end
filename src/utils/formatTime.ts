import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-tw";

export const formatTime = (time: number | string) => {
  if (typeof time === "number") {
    return dayjs(time * 1000).format("YYYY-MM-DD HH:mm");
  }
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};
