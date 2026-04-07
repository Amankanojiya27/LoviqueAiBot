import type { CompanionPersonality, UserGender } from './types';

export const companionGenderOptions: Array<{ value: UserGender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const personalityOptions: Array<{
  value: CompanionPersonality;
  label: string;
  description: string;
}> = [
  {
    value: 'sweet',
    label: 'Sweet',
    description: 'Warm, affectionate, and reassuring.',
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Teasing, lively, and fun to talk to.',
  },
  {
    value: 'calm',
    label: 'Calm',
    description: 'Soft-spoken, grounded, and easygoing.',
  },
  {
    value: 'romantic',
    label: 'Romantic',
    description: 'Tender, dreamy, and emotionally expressive.',
  },
];

export const getGenderLabel = (value: UserGender): string => {
  return companionGenderOptions.find((option) => option.value === value)?.label ?? 'Male';
};

export const getCompanionLabel = (value: UserGender): string => {
  return `${getGenderLabel(value)} companion`;
};

export const getPersonalityLabel = (value: CompanionPersonality): string => {
  return personalityOptions.find((option) => option.value === value)?.label ?? 'Sweet';
};

export const getPersonalityDescription = (value: CompanionPersonality): string => {
  return (
    personalityOptions.find((option) => option.value === value)?.description ??
    'Warm, affectionate, and reassuring.'
  );
};
