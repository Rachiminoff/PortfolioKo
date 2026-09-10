export interface PersonaQuote {
  quote: string;
  attribution?: string;
  source?: string;
  note?: string;
}

// Add the quotes you want to keep here.
// Keep each quote short enough to read comfortably as a card.
export const personaQuotes: PersonaQuote[] = [
  {
    quote:
      'In my travels at the video stores and comic book conventions, I’ve heard of tales of a man made structured becoming possessed by a human soul so that the spirit could merge with wood and brick creating some rare form of monster known as Domus Mactibilis',
    attribution: 'Reginal Skulinski',
    source: 'Monster House',
  },
];
