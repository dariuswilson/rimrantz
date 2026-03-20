const BLOCKED_TERMS = [
  // Swear words
  "fuck",
  "shit",
  "ass",
  "bitch",
  "damn",
  "crap",
  "piss",
  "cock",
  "dick",
  "pussy",
  "bastard",
  "cunt",
  "asshole",
  "bullshit",
  "motherfucker",
  "fucker",

  // Racial slurs
  "nigger",
  "nigga",
  "chink",
  "spic",
  "kike",
  "gook",
  "wetback",
  "cracker",
  "beaner",
  "raghead",
  "towelhead",
  "coon",
  "zipperhead",

  // Homophobic slurs
  "faggot",
  "fag",
  "dyke",
  "tranny",

  // Sexual terms
  "penis",
  "vagina",
  "boobs",
  "tits",
  "porn",
  "nude",
  "naked",
  "horny",
  "dildo",
  "anal",
  "cumshot",
  "blowjob",
  "handjob",
];

export const containsBlockedTerm = (text) => {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return BLOCKED_TERMS.some((term) => lower.includes(term));
};
