/**
 * Shared utilities for CuppaNative
 */

/**
 * Masks a name for non-premium users (e.g. "John Doe" -> "J. D.")
 * @param {string} fullName 
 * @returns {string}
 */
export const maskName = (fullName) => {
  if (!fullName) return "?.?.";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstInitial = parts[0]?.[0] || '?';
    const secondInitial = parts[1]?.[0] || '?';
    return `${firstInitial}. ${secondInitial}.`;
  }
  return `${fullName[0] || '?'}.`;
};

/**
 * Calculates age from date of birth string (YYYY-MM-DD)
 * @param {string} dob 
 * @returns {number}
 */
export const calculateAge = (dob) => {
  if (!dob) return 25; // Default fallback
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    console.error("Error calculating age:", e);
    return 25;
  }
};
