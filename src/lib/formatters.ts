export const formatPhone = (phone: string) => {
  if (phone.startsWith("+")) return phone;
  if (phone.startsWith("09")) {
    return `+63${phone.slice(1)}`;
  }
  if (phone.startsWith("9") && phone.length === 10) {
    return `+63${phone}`;
  }
  return phone;
};

export const formatDateTime = (value: string) => new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
