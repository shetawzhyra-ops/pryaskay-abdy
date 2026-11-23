/**
 * Strict Registration Validation & Digit Normalization Helper (Shared Server + Test Module)
 * Ensures every mandatory registration field is genuinely & properly provided:
 * full_name, gender, username, password, phone, languages, profession, residence, certificate.
 */

function normalizeDigits(str) {
  if (str == null) return '';
  return String(str)
    // Arabic-Indic digits
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    // Eastern Arabic-Indic (Persian/Kurdish) digits
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0));
}

function cleanText(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

function hasRealLetters(str) {
  return /[A-Za-z\u0600-\u06FF]/.test(String(str || ''));
}

function isRepeatingJunk(str) {
  const s = cleanText(str).replace(/\s+/g, '');
  if (s.length >= 4 && /^(.)\1+$/.test(s)) return true;
  if (/^[.\-_!?@#$%^&*+=~/\\]+$/.test(s)) return true;
  return false;
}

function validatePhone(rawPhone) {
  const normalized = normalizeDigits(cleanText(rawPhone));
  if (!normalized) {
    return { valid: false, error: 'تکایە ژمارەی تەلەفون بنووسە (ئیجبارییە).' };
  }
  if (!/^[0-9+\s\-()]+$/.test(normalized)) {
    return { valid: false, error: 'ژمارەی تەلەفون دەبێت تەنها ژمارە بێت (نموونە: 07501234567).' };
  }
  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, error: 'ژمارەی تەلەفون نادروستە (پێویستە لە نێوان ٧ بۆ ١٥ ژمارەدا بێت).' };
  }
  if (/^(\d)\1{6,}$/.test(digitsOnly)) {
    return { valid: false, error: 'تکایە ژمارەیەکی تەلەفونی ڕاستەقینە بنووسە.' };
  }
  return { valid: true, value: normalized };
}

function validateLanguages(rawLanguages) {
  const text = cleanText(rawLanguages);
  const normalized = normalizeDigits(text);
  if (!text) {
    return { valid: false, error: 'تکایە دیاری بکە چەند زمان دەزانیت (ئیجبارییە).' };
  }
  if (isRepeatingJunk(text)) {
    return { valid: false, error: 'تکایە بە دروستی بنووسە چەند زمان دەزانیت.' };
  }
  if (/^\d+$/.test(normalized)) {
    const count = Number(normalized);
    if (count < 1 || count > 20) {
      return { valid: false, error: 'ژمارەی زمانەکان پێویستە بە دروستی بنووسرێت (١ تا ٢٠).' };
    }
    return { valid: true, value: text };
  }
  if (text.length < 2 || !hasRealLetters(text)) {
    return { valid: false, error: 'تکایە بە ڕوونی بنووسە چەند زمان و کام زمانانە دەزانیت.' };
  }
  return { valid: true, value: text };
}

function validateTextField(rawVal, emptyError, invalidError, minLen = 2) {
  const val = cleanText(rawVal);
  if (!val) {
    return { valid: false, error: emptyError };
  }
  if (val.length < minLen || !hasRealLetters(val) || isRepeatingJunk(val)) {
    return { valid: false, error: invalidError };
  }
  return { valid: true, value: val };
}

function validateRegistrationPayload(body = {}) {
  const fullNameRes = validateTextField(
    body.full_name,
    'تکایە ناوی سیانی بە تەواوی بنووسە.',
    'ناوی سیانی پێویستە بە پیت و بە دروستی بنووسرێت (بەلایەنی کەم ٣ پیت).',
    3
  );
  if (!fullNameRes.valid) return { valid: false, field: 'full_name', error: fullNameRes.error };

  const genderRaw = cleanText(body.gender || 'male').toLowerCase();
  if (genderRaw !== 'male' && genderRaw !== 'female') {
    return { valid: false, field: 'gender', error: 'تکایە ڕەگەز هەڵبژێرە.' };
  }

  const phoneRes = validatePhone(body.phone);
  if (!phoneRes.valid) return { valid: false, field: 'phone', error: phoneRes.error };

  const langRes = validateLanguages(body.languages);
  if (!langRes.valid) return { valid: false, field: 'languages', error: langRes.error };

  const profRes = validateTextField(
    body.profession,
    'تکایە پیشەکەت بنووسە (ئیجبارییە).',
    'تکایە پیشەکەت بە دروستی و بە وشە بنووسە.',
    2
  );
  if (!profRes.valid) return { valid: false, field: 'profession', error: profRes.error };

  const resRes = validateTextField(
    body.residence,
    'تکایە شوێنی نیشتەجێبوونت بنووسە (ئیجبارییە).',
    'تکایە شوێنی نیشتەجێبوون بە دروستی بنووسە (نموونە: هەولێر).',
    2
  );
  if (!resRes.valid) return { valid: false, field: 'residence', error: resRes.error };

  const certRes = validateTextField(
    body.certificate,
    'تکایە بڕوانامەکەت بنووسە (ئیجبارییە).',
    'تکایە بڕوانامەکەت بە دروستی بنووسە (نموونە: دواناوەندی، بەکالۆریۆس...).',
    2
  );
  if (!certRes.valid) return { valid: false, field: 'certificate', error: certRes.error };

  const usernameClean = cleanText(body.username).toLowerCase();
  if (!usernameClean || usernameClean.length < 2 || isRepeatingJunk(usernameClean)) {
    return { valid: false, field: 'username', error: 'تکایە ناوی خوازراو (Nickname) بە دروستی بنووسە.' };
  }

  const passwordRaw = typeof body.password === 'string' ? body.password : '';
  if (!passwordRaw || passwordRaw.length < 4) {
    return { valid: false, field: 'password', error: 'وشەی نهێنی پێویستە بە لایەنی کەم ٤ پیت یان ژمارە بێت.' };
  }

  return {
    valid: true,
    data: {
      full_name: fullNameRes.value,
      gender: genderRaw,
      phone: phoneRes.value,
      languages: langRes.value,
      profession: profRes.value,
      residence: resRes.value,
      certificate: certRes.value,
      username: usernameClean,
      password: passwordRaw
    }
  };
}

module.exports = {
  normalizeDigits,
  validatePhone,
  validateLanguages,
  validateTextField,
  validateRegistrationPayload
};
