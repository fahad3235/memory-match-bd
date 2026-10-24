/* memory-match-bd — bilingual (EN/বাংলা) UI strings. UTF-8. */
'use strict';

const MMBI18n = (() => {
  const STR = {
    en: {
      tagline: 'A bilingual memory card game — match English words with their Bangla meanings.',
      mode: 'Deck',
      modeWords: 'Words (EN ⇄ বাংলা)',
      modeIcons: 'Icons',
      level: 'Level',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      pairsNote: function (n) { return n + ' pairs'; },
      newGame: 'New game',
      moves: 'Moves',
      time: 'Time',
      matched: 'Matched',
      best: 'Best',
      noBest: '—',
      winTitle: 'You did it!',
      winSubtitle: function (moves, time, stars) { return stars + ' — ' + moves + ' moves in ' + time; },
      playAgain: 'Play again',
      bestSaved: 'New best score!',
      star3: 'Excellent memory!',
      star2: 'Good job!',
      star1: 'Keep practicing!',
      howTo: 'How to play',
      howToText: 'Tap a card to flip it. Find its matching pair — English word with its Bangla meaning (or the same icon twice). Fewer moves and less time earn more stars. Your best score for each level is saved on this device.',
      footer: 'Runs fully offline in your browser. No account, no data leaves your device.',
    },
    bn: {
      tagline: 'দ্বিভাষিক মেমোরি কার্ড গেম — ইংরেজি শব্দের সঙ্গে তার বাংলা অর্থ মিলিয়ে নিন।',
      mode: 'ডেক',
      modeWords: 'শব্দ (EN ⇄ বাংলা)',
      modeIcons: 'আইকন',
      level: 'লেভেল',
      easy: 'সহজ',
      medium: 'মাঝারি',
      hard: 'কঠিন',
      pairsNote: function (n) { return n + ' জোড়া'; },
      newGame: 'নতুন গেম',
      moves: 'চাল',
      time: 'সময়',
      matched: 'মিলেছে',
      best: 'সেরা',
      noBest: '—',
      winTitle: 'অভিনন্দন!',
      winSubtitle: function (moves, time, stars) { return stars + ' — ' + moves + ' চালে, ' + time + ' সময়ে'; },
      playAgain: 'আবার খেলুন',
      bestSaved: 'নতুন সেরা স্কোর!',
      star3: 'চমৎকার স্মৃতিশক্তি!',
      star2: 'ভালো হয়েছে!',
      star1: 'আরও চর্চা করুন!',
      howTo: 'কীভাবে খেলবেন',
      howToText: 'কার্ডে ট্যাপ করলেই উল্টাবে। তার জোড়া খুঁজুন — ইংরেজি শব্দের সঙ্গে বাংলা অর্থ (অথবা একই আইকন দুবার)। কম চালে ও কম সময়ে বেশি তারা পাবেন। প্রতিটি লেভেলের সেরা স্কোর এই ডিভাইসে সংরক্ষিত থাকবে।',
      footer: 'আপনার ব্রাউজারে সম্পূর্ণ অফলাইনে চলে। কোনো অ্যাকাউন্ট লাগে না, কোনো তথ্য ডিভাইসের বাইরে যায় না।',
    },
  };

  function t(lang, key) {
    const args = Array.prototype.slice.call(arguments, 2);
    const pack = STR[lang] || STR.en;
    const v = pack[key];
    if (typeof v === 'function') return v.apply(null, args);
    return v != null ? v : key;
  }

  return { t: t };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MMBI18n;
