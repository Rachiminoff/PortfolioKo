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

export type PersonaNote = {
  date: string;
  tag: string;
  title: string;
  body: string;
};

export const currently: PersonaCurrentlyItem[] = [
  { label: 'READING', value: 'Something with too many pages', icon: 'mdi:book-open-blank-variant', image: 'https://placehold.co/800x1000/11151a/eeeeee?text=READING' },
  { label: 'WATCHING', value: 'One episode became five', icon: 'mdi:television-play', image: 'https://placehold.co/800x1000/11151a/eeeeee?text=WATCHING' },
  { label: 'PLAYING', value: 'The current time sink', icon: 'mdi:gamepad-variant', image: 'https://placehold.co/800x1000/11151a/eeeeee?text=PLAYING' },
  { label: 'LISTENING', value: 'On repeat again', icon: 'mdi:headphones', image: 'https://placehold.co/800x1000/11151a/eeeeee?text=LISTENING' },
];

const thum = (url: string) => `https://image.thum.io/get/width/700/crop/900/${url}`;

export const favorites: Record<string, PersonaMediaItem[]> = {
  Manga: [
    {
      title: 'Hunter x Hunter', meta: 'MANGA / FAVOURITE',
      note: 'An endlessly inventive adventure where the rules of its world are as interesting as the people living inside them.',
      malQuery: 'Hunter x Hunter', source: 'https://myanimelist.net/manga/26',
    },
    {
      title: 'DEATH NOTE', meta: 'MANGA / FAVOURITE',
      note: 'A tightly constructed battle of ideas, ego and consequence that keeps turning its own premise against its characters.',
      malQuery: 'Death Note', source: 'https://myanimelist.net/manga/21',
    },
    {
      title: 'HER TALE OF SHIMCHEONG', meta: 'MANGA / FAVOURITE',
      note: 'A lush historical romance built around devotion, class, longing and the quiet weight of choosing another person.',
      malQuery: 'Her Tale of Shim Cheong', source: 'https://myanimelist.net/manga/118737',
    },
  ],
  Books: [
    {
      title: 'ADACHI AND SHIMAMURA', meta: 'LIGHT NOVEL / FAVOURITE',
      note: 'A slow, interior story about two girls learning what their attachment to each other actually means.',
      image: 'https://books.google.com/books/content?id=Kp8LEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      source: 'https://www.goodreads.com/book/show/51937791',
    },
    {
      title: 'CORALINE', meta: 'NOVEL / FAVOURITE',
      note: 'Small, strange and unsettling: a story about curiosity, courage and recognising when something perfect is wrong.',
      image: 'https://images-na.ssl-images-amazon.com/images/P/0380807343.01.LZZZZZZZ.jpg',
      source: 'https://www.goodreads.com/book/show/15739667-coraline',
    },
    {
      title: 'MY FEELINGS CAN WAIT', meta: 'WEB NOVEL / FAVOURITE',
      note: 'A second-chance romance that takes its time with regret, communication and the difficult work of learning how to love better.',
      image: thum('https://www.novelupdates.com/series/my-feelings-can-wait/'),
      source: 'https://www.novelupdates.com/series/my-feelings-can-wait/',
    },
    {
      title: 'IF I COULD MAIL YOU A BOOK', meta: 'WEB NOVEL / FAVOURITE',
      note: 'A gentle, adult slow-burn about healing from old relationships and finding something warm and ordinary together.',
      image: thum('https://www.novelupdates.com/series/if-i-could-mail-you-a-book/'),
      source: 'https://www.novelupdates.com/series/if-i-could-mail-you-a-book/',
    },
  ],
  Movies: [
    {
      title: 'CORALINE', meta: 'FILM / FAVOURITE',
      note: 'Stop-motion fairy-tale horror with immaculate production design and just enough childhood unease to make the comfort feel strange.',
      image: 'https://www.impawards.com/2009/posters/coraline.jpg', source: 'https://letterboxd.com/film/coraline/',
    },
    {
      title: 'CAROL', meta: 'FILM / FAVOURITE',
      note: 'A restrained romance where glances, silence and tiny shifts in distance do as much work as dialogue.',
      image: 'https://www.impawards.com/2015/posters/carol.jpg', source: 'https://letterboxd.com/film/carol-2015/',
    },
    {
      title: 'JACK AND THE CUCKOO CLOCK HEART', meta: 'FILM / FAVOURITE',
      note: 'A melancholy animated fairy tale with a mechanical heart, theatrical visuals and a very sincere belief in doomed romance.',
      image: 'https://www.impawards.com/2014/posters/jack_and_the_cuckoo_clock_heart.jpg', source: 'https://letterboxd.com/film/jack-and-the-cuckoo-clock-heart/',
    },
    {
      title: 'THE BREAKFAST CLUB', meta: 'FILM / FAVOURITE',
      note: 'A deceptively simple detention-room character study that lets five stereotypes become people once everyone starts talking.',
      image: 'https://www.impawards.com/1985/posters/breakfast_club.jpg', source: 'https://letterboxd.com/film/the-breakfast-club/',
    },
    {
      title: 'THE HANDMAIDEN', meta: 'FILM / FAVOURITE',
      note: 'A meticulously staged psychological romance built around deception, desire, power and the pleasure of watching a plan unravel.',
      image: thum('https://letterboxd.com/film/the-handmaiden/poster/'), source: 'https://letterboxd.com/film/the-handmaiden/',
    },
    {
      title: 'SCOTT PILGRIM VS. THE WORLD', meta: 'FILM / FAVOURITE',
      note: 'Comic-book velocity, absurd fights and an aggressively playful visual language wrapped around a story about growing up.',
      image: 'https://www.impawards.com/2010/posters/scott_pilgrim_vs_the_world.jpg', source: 'https://letterboxd.com/film/scott-pilgrim-vs-the-world/',
    },
  ],
  Games: [
    {
      title: 'GENSHIN IMPACT', meta: 'GAME / FAVOURITE',
      note: 'A sprawling world to wander through when the actual objective is less important than seeing what is over the next hill.',
      image: thum('https://genshin.hoyoverse.com/en/'), source: 'https://genshin.hoyoverse.com/en/',
    },
    {
      title: 'THE HOUSE IN FATA MORGANA', meta: 'VISUAL NOVEL / FAVOURITE',
      note: 'Gothic tragedy told through memory, repetition and a house that seems determined to make every wound linger.',
      image: 'https://cdn.akamai.steamstatic.com/steam/apps/303310/header.jpg', source: 'https://store.steampowered.com/app/303310/The_House_in_Fata_Morgana/',
    },
    {
      title: 'ACE ATTORNEY TRILOGY', meta: 'GAME / FAVOURITE',
      note: 'Ridiculous courtroom theatrics hiding an unusually earnest love for deduction, character and dramatic reveals.',
      image: thum('https://www.playstation.com/en-ph/games/ace-attorney-investigations-collection/'), source: 'https://www.playstation.com/en-ph/games/ace-attorney-investigations-collection/',
    },
    {
      title: 'THE LEGEND OF ZELDA: SPIRIT TRACKS', meta: 'GAME / FAVOURITE',
      note: 'A charming Zelda adventure whose strange train-bound world gives its exploration a distinct little rhythm.',
      image: thum('https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Spirit_Tracks'), source: 'https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Spirit_Tracks',
    },
    {
      title: "THE LEGEND OF ZELDA: MAJORA'S MASK", meta: 'GAME / FAVOURITE',
      note: 'A darker Zelda built around repetition, regret and the knowledge that three days can contain an entire lifetime.',
      image: thum("https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Majora's_Mask"), source: "https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Majora's_Mask",
    },
    {
      title: 'PERSONA 4 GOLDEN', meta: 'GAME / FAVOURITE',
      note: 'Part mystery, part social simulator and part long summer memory — its appeal is how much time it lets you spend simply knowing people.',
      image: 'https://cdn.akamai.steamstatic.com/steam/apps/1113000/header.jpg', source: 'https://store.steampowered.com/app/1113000/Persona_4_Golden/',
    },
    {
      title: 'FLOWERS: LE VOLUME SUR ETE', meta: 'VISUAL NOVEL / FAVOURITE',
      note: 'A delicate summer chapter full of schoolgirl intimacy, emotional restraint and hand-drawn atmosphere.',
      image: 'https://cdn.akamai.steamstatic.com/steam/apps/858940/header.jpg', source: 'https://store.steampowered.com/app/858940/Flowers_Le_volume_sur_ete/',
    },
    {
      title: 'LIFE IS STRANGE', meta: 'GAME / FAVOURITE',
      note: 'A coming-of-age mystery where photographs, music and impossible choices make ordinary places feel strangely precious.',
      image: 'https://cdn.akamai.steamstatic.com/steam/apps/319630/header.jpg', source: 'https://store.steampowered.com/app/319630/Life_is_Strange/',
    },
    {
      title: 'RED DEAD REDEMPTION 2', meta: 'GAME / FAVOURITE',
      note: 'A huge western that is at its best when it slows down enough to let its characters, landscapes and quiet routines breathe.',
      image: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg', source: 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/',
    },
  ],
  Songs: [
    {
      title: 'BLACK SHEEP — BRIE LARSON', meta: 'SONG / FAVOURITE',
      note: 'Pure Scott Pilgrim energy: sugary pop-rock, ridiculous confidence and a performance that is inseparable from the scene around it.',
      image: thum('https://www.youtube.com/results?search_query=Black+Sheep+Brie+Larson'), source: 'https://www.youtube.com/results?search_query=Black+Sheep+Brie+Larson',
    },
    {
      title: 'BAD ROMANCE — LADY GAGA', meta: 'SONG / FAVOURITE',
      note: 'Maximalist pop that commits completely to its hooks, production and theatrical sense of scale.',
      image: thum('https://en.wikipedia.org/wiki/Bad_Romance'), source: 'https://en.wikipedia.org/wiki/Bad_Romance',
    },
    {
      title: "TEARIN' UP MY HEART — NSYNC", meta: 'SONG / FAVOURITE',
      note: 'Peak late-90s boy-band pop: instantly recognisable harmonies, an enormous hook and absolutely no interest in subtlety.',
      image: thum("https://en.wikipedia.org/wiki/Tearin%27_Up_My_Heart"), source: "https://en.wikipedia.org/wiki/Tearin%27_Up_My_Heart",
    },
  ],
};

export const notes: PersonaNote[] = [
  { date: '09.08.26', tag: 'THOUGHT', title: 'I like making little corners of the internet.', body: 'Not everything has to be a project, a credential, or something that belongs on a résumé. Sometimes it is nice to simply leave a trace of what I liked.' },
  { date: '09.02.26', tag: 'MEDIA', title: 'Stories are weird little time machines.', body: 'A book, song, game, or manga can preserve an entire version of you. You revisit it years later and suddenly remember who you were.' },
  { date: '08.27.26', tag: 'NOTE', title: "Currently collecting things I don't need.", body: 'Screenshots, quotes, tabs, playlists, unfinished thoughts. This page is probably going to make that worse.' },
];
