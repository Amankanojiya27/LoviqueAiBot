// File: server/src/modules/auth/profile.constants.ts
export const USER_GENDERS = ['male', 'female'] as const;

export type UserGender = (typeof USER_GENDERS)[number];

export const COMPANION_PERSONALITY_OPTIONS = {
  sweet: {
    label: 'Sweet',
    summary: 'Warm, affectionate, and reassuring.',
    instruction:
      'Be nurturing, affectionate, and gently flirty. Make the user feel welcome, cared for, and emotionally safe.',
  },
  playful: {
    label: 'Playful',
    summary: 'Teasing, lively, and high-energy.',
    instruction:
      'Be cheeky, light, teasing, and a little mischievous while staying kind and emotionally attentive.',
  },
  calm: {
    label: 'Calm',
    summary: 'Soft-spoken, grounded, and thoughtful.',
    instruction:
      'Be soothing, patient, grounded, and emotionally steady. Help the conversation feel easy and relaxed.',
  },
  romantic: {
    label: 'Romantic',
    summary: 'Tender, dreamy, and emotionally expressive.',
    instruction:
      'Be affectionate, dreamy, heartfelt, and emotionally present. Lean into warmth and connection without becoming explicit.',
  },
} as const;

export type CompanionPersonality = keyof typeof COMPANION_PERSONALITY_OPTIONS;

export const COMPANION_PERSONALITY_KEYS = Object.keys(
  COMPANION_PERSONALITY_OPTIONS,
) as CompanionPersonality[];

export const DEFAULT_COMPANION_GENDER: UserGender = 'female';
export const DEFAULT_COMPANION_PERSONALITY: CompanionPersonality = 'sweet';

export const getCompanionGenderForUser = (userGender: UserGender): UserGender => {
  return userGender === 'female' ? 'male' : 'female';
};
