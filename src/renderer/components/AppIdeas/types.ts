export type AppCategory = 'Utility' | 'Education' | 'Productivity' | 'Lifestyle' | 'Other';
export type MonetizationType = 'One-time purchase' | 'Free' | 'Subscription' | 'IAP';

export interface AppIdea {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // 📌 Basic Info
  appTitle: string;
  packageName: string;
  easProjectId: string;
  appDescription: string;
  targetAudience: string;
  appCategory: AppCategory;

  // 🎨 Visual Assets
  playStoreIconNotes: string;
  adaptiveIconForeground: string;
  adaptiveIconBgColor: string;
  splashScreenDescription: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  font: string;

  // 💰 Monetization
  monetizationType: MonetizationType;
  priceRON: string;
  iapDescription: string;

  // 📋 Play Store Listing
  shortDescription: string;
  fullDescription: string;
  keywords: string;

  // 🤖 AI Prompts
  bigBangPrompt: string;
  googleAIStudioNotes: string;
  antigravityPrompt: string;

  // 💻 Technical
  terminalCommands: string;
  dependencies: string;
  firebaseNotes: string;
  romanianLocalizationNotes: string;

  // 📝 Extra Notes
  extraNotes: string;
}

export function createEmptyAppIdea(name: string): AppIdea {
  return {
    id: 'idea-' + Date.now(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    appTitle: '',
    packageName: '',
    easProjectId: '',
    appDescription: '',
    targetAudience: '',
    appCategory: 'Utility',
    playStoreIconNotes: '',
    adaptiveIconForeground: '',
    adaptiveIconBgColor: '#FFFFFF',
    splashScreenDescription: '',
    primaryColor: '#000000',
    secondaryColor: '#000000',
    backgroundColor: '#FFFFFF',
    font: '',
    monetizationType: 'Free',
    priceRON: '',
    iapDescription: '',
    shortDescription: '',
    fullDescription: '',
    keywords: '',
    bigBangPrompt: '',
    googleAIStudioNotes: '',
    antigravityPrompt: '',
    terminalCommands: '',
    dependencies: '',
    firebaseNotes: '',
    romanianLocalizationNotes: '',
    extraNotes: '',
  };
}
