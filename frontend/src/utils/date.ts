export const formatDate = (isoString: string) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (isoString: string | null) => {
  if (!isoString) return "Chưa bắt đầu";
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
