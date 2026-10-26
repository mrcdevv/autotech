export interface PasswordFormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export function validateNewPassword(newPassword: string, confirmPassword: string): PasswordFormErrors {
  const errors: PasswordFormErrors = {};
  if (newPassword.length < 6) {
    errors.newPassword = "La contraseña debe tener al menos 6 caracteres";
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Repetí la contraseña";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }
  return errors;
}
