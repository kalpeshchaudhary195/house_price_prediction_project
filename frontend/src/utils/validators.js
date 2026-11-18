export function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).trim());
}

export function isValidPhone(phone) {
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  const re = /^\+?[0-9]{10,15}$/;
  return re.test(cleaned);
}

export function passwordStrength(val) {
  if (!val) return { score: 0, label: 'None', hasMinLen: false, hasUpper: false, hasNumber: false };

  const hasMinLen = val.length >= 8;
  const hasUpper = /[A-Z]/.test(val);
  const hasNumber = /[0-9]/.test(val);
  const hasSpecial = /[^A-Za-z0-9]/.test(val);

  let score = 0;
  if (hasMinLen) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial && val.length >= 10) score++;

  const label = score <= 1 ? 'Weak' : score === 2 ? 'Medium' : 'Strong 💪';
  return { score, label, hasMinLen, hasUpper, hasNumber };
}
