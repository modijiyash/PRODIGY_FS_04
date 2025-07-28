export function formatMessageTime(date){
  if (!date) return ""; // or return "Invalid date"
  const dt = new Date(date);
  if (isNaN(dt)) return ""; // not a valid date
  return dt.toLocaleTimeString("en-us", {
    hour: "2-digit",
    minute : "2-digit",
    hour12: false,
  });
}
