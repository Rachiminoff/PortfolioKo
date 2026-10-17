export type PersonaMediaItem = {
  title: string;
  meta: string;
  note: string;
  image?: string;
  malQuery?: string;
  source?: string;
};

export type PersonaCurrentlyItem = {
  label: string;
  value: string;
  icon: string;
  image?: string;
};

export interface PersonaQuote {
  quote: string;
  attribution?: string;
  source?: string;
  note?: string;
}

export type PersonaData = {
  currently: PersonaCurrentlyItem[];
  favorites: Record<string, PersonaMediaItem[]>;
  quotes: PersonaQuote[];
};
