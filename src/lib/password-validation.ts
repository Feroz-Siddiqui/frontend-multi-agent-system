// Utility function to validate password against backend requirements
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: number;
} => {
  const errors: string[] = [];
  let strength = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    strength += 25;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strength += 25;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strength += 25;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  } else {
    strength += 25;
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};
