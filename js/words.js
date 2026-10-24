/* memory-match-bd — word pool (English <-> Bangla) and icon pool.
 * Saved as UTF-8. Bengali spellings hand-checked against standard dictionary forms.
 */
'use strict';

const MMBWords = {
  WORD_PAIRS: [
    { en: 'Sun',        bn: 'সূর্য' },
    { en: 'Moon',       bn: 'চাঁদ' },
    { en: 'Water',      bn: 'পানি' },
    { en: 'Rice',       bn: 'ভাত' },
    { en: 'Fish',       bn: 'মাছ' },
    { en: 'Tree',       bn: 'গাছ' },
    { en: 'Book',       bn: 'বই' },
    { en: 'House',      bn: 'বাড়ি' },
    { en: 'Friend',     bn: 'বন্ধু' },
    { en: 'Mother',     bn: 'মা' },
    { en: 'Father',     bn: 'বাবা' },
    { en: 'School',     bn: 'বিদ্যালয়' },
    { en: 'Rain',       bn: 'বৃষ্টি' },
    { en: 'River',      bn: 'নদী' },
    { en: 'Bird',       bn: 'পাখি' },
    { en: 'Flower',     bn: 'ফুল' },
    { en: 'Night',      bn: 'রাত' },
    { en: 'Morning',    bn: 'সকাল' },
    { en: 'Road',       bn: 'রাস্তা' },
    { en: 'Market',     bn: 'বাজার' },
    { en: 'Money',      bn: 'টাকা' },
    { en: 'Love',       bn: 'ভালোবাসা' },
    { en: 'Dream',      bn: 'স্বপ্ন' },
    { en: 'Smile',      bn: 'হাসি' },
    { en: 'Courage',    bn: 'সাহস' },
    { en: 'Knowledge',  bn: 'জ্ঞান' },
    { en: 'Village',    bn: 'গ্রাম' },
    { en: 'City',       bn: 'শহর' },
  ],
  ICON_POOL: [
    '🐯', '🐘', '🦚', '🐬', '🦋', '🌺', '🍉', '🥭',
    '🚲', '⛵', '🪁', '🏏', '⚽', '🎸', '📚', '☕',
    '🌙', '☀️', '🌧️', '🔥', '💧', '🍃', '⭐', '🎈',
  ],
};

if (typeof module !== 'undefined' && module.exports) module.exports = MMBWords;
