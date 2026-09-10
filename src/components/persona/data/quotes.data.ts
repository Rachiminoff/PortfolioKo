export interface PersonaQuote {
  quote: string;
  attribution?: string;
  source?: string;
  note?: string;
}
// Keep each quote short enough to read comfortably as a card.
export const personaQuotes: PersonaQuote[] = [
  {
    quote:
      'In my travels at the video stores and comic book conventions, I’ve heard of tales of a man made structured becoming possessed by a human soul so that the spirit could merge with wood and brick creating some rare form of monster known as Domus Mactibilis',
    attribution: 'Reginal Skulinski',
    source: 'Monster House',
  },
  {
    quote:
      'Adachi, and my memories. Attempting to view them both at the same time, all I was able to focus my eyes on was the former. I pulled my hand forward and held it over her face. I could only pray that one day, this image would become part of the sea. “Let’s hope so”',
    attribution: 'Shimamura',
    source: 'Adachi to Shimamura',
  },
];
