export const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates a password + confirmation pair.
 * Returns an error message string, or null if valid.
 */
export function validatePassword(password: string, confirm: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
