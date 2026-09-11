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
      'And soon, another color would arrive. Every time we met, everything would be painted over once again. The world would take on her color. I would keep walking straight through that world. Toward the dawn, bathed in bronze light. As the shadows receded with the coming of daybreak, a figure emerged. I ran toward her. "Adachi." "Shimamura." We would go on chasing "and" forever. Pouring every feeling in the world into that single word.',
    attribution: 'Shimamura',
    source: 'Adachi to Shimamura',
  },
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
