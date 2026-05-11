/**
 * @param {string} formatKey 'mmdd' | 'ddmm' | 'iso'
 */
export function formatDateWithPreference(dateString, formatKey = "mmdd") {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (formatKey === "iso") return `${y}-${m}-${day}`;
  if (formatKey === "ddmm") return `${day}/${m}/${y}`;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Default long US format (backward compatible) */
export function formatDate(dateString) {
  return formatDateWithPreference(dateString, "mmdd");
}
