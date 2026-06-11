/* Seed content — single source of truth. build.mjs turns this into
 * (a) seed/production.ndjson for `sanity dataset import` and
 * (b) src/lib/sanity/fixtures-data.json for the no-projectId fixture mode.
 * All of it is placeholder material for the collective to replace; all of
 * it is original. Image `file` names refer to seed/images/. */
import { readFileSync } from 'node:fs';

/* The archive wall's volume census — shared with generate-images.py so the
 * editorial entries and the rendered files can never drift. */
const wall = JSON.parse(readFileSync(new URL('./scraps-wall.json', import.meta.url), 'utf8'));

export const works = [
	{
		_id: 'work-tin-roof-frequencies',
		title: 'Tin Roof Frequencies',
		slug: 'tin-roof-frequencies',
		year: 2026,
		publishedAt: '2026-05-12T10:00:00Z',
		medium: 'Photo',
		descriptors: ['Series'],
		standfirst:
			'Eleven rooftops recorded at the hour the rain arrives — a photographic score of corrugated iron, water and waiting.',
		cover: { file: 'cover-tin-roof-frequencies.jpg', alt: 'Magenta and pink fields crossed by dark ink strokes' },
		coverLoop: { file: 'loop-tin-roof.webm' },
		gallery: [
			{ file: 'gallery-tinroof-1.jpg', alt: 'Pink field with a diagonal band', caption: 'Rooftop I, Lalbagh' },
			{ file: 'gallery-tinroof-2.jpg', alt: 'Layered magenta rectangles', caption: 'Rooftop VII, Hazaribagh' }
		],
		credits: [
			{ role: 'Photography', names: ['Anika Rahman'] },
			{ role: 'Sequencing', names: ['Nusrat Jahan'] }
		]
	},
	{
		_id: 'work-city-memory-map',
		title: 'City Memory Map',
		slug: 'city-memory-map',
		year: 2026,
		publishedAt: '2026-03-02T10:00:00Z',
		medium: 'Interactive',
		descriptors: ['Map'],
		standfirst:
			'A pannable map of remembered Dhaka. Drift through the districts people carry in their heads — drawn from memory, not satellites.',
		cover: { file: 'cover-city-memory-map.jpg', alt: 'Marigold and ochre blocks with thin ink lines' },
		interactive: true,
		componentKey: 'city-memory',
		credits: [
			{ role: 'Concept', names: ['Tanvir Ahmed', 'Anika Rahman'] },
			{ role: 'Code', names: ['Tanvir Ahmed'] }
		]
	},
	{
		_id: 'work-buriganga-night-crossing',
		title: 'Buriganga Night Crossing',
		slug: 'buriganga-night-crossing',
		year: 2025,
		publishedAt: '2025-11-19T10:00:00Z',
		medium: 'Video',
		descriptors: ['Film'],
		standfirst:
			'Eight minutes on a wooden launch between Sadarghat and Keraniganj, shot in one take after the generators fail.',
		cover: { file: 'cover-buriganga-night-crossing.jpg', alt: 'Indigo fields over a pale ground, like river light' },
		hero: {
			kind: 'embed',
			embedUrl: 'https://vimeo.com/76979871',
			poster: { file: 'poster-buriganga-night-crossing.jpg', alt: 'Wide indigo composition with a single bright band' }
		},
		credits: [
			{ role: 'Direction', names: ['Fahim Chowdhury'] },
			{ role: 'Sound', names: ['Sadia Islam'] }
		]
	},
	{
		_id: 'work-monsoon-ledger',
		title: 'Monsoon Ledger',
		slug: 'monsoon-ledger',
		year: 2025,
		publishedAt: '2025-07-30T10:00:00Z',
		medium: 'Photo',
		descriptors: ['Series'],
		standfirst:
			'A season of water kept like accounts: nine photographs of the city balancing its books with the sky.',
		cover: { file: 'cover-monsoon-ledger.jpg', alt: 'Teal washes with hairline ink rules, like wet paper' },
		gallery: [
			{ file: 'gallery-monsoon-1.jpg', alt: 'Pale teal field with an ellipse of deeper green', caption: 'Entry 2, Old Town' },
			{ file: 'gallery-monsoon-2.jpg', alt: 'Two overlapping teal rectangles', caption: 'Entry 5, Mirpur' },
			{ file: 'gallery-monsoon-3.jpg', alt: 'Teal band across a light ground', caption: 'Entry 9, balance' }
		],
		credits: [{ role: 'Photography', names: ['Anika Rahman'] }]
	},
	{
		_id: 'work-forty-mosques-one-azan',
		title: 'Forty Mosques, One Azan',
		slug: 'forty-mosques-one-azan',
		year: 2024,
		publishedAt: '2024-12-05T10:00:00Z',
		medium: 'Mixed',
		descriptors: ['Sound', 'Essay'],
		standfirst:
			'Forty muezzins begin within ninety seconds of each other. A listening essay on how a city agrees on time without a clock.',
		cover: { file: 'cover-forty-mosques-one-azan.jpg', alt: 'Moss green planes stacked like evening rooftops' },
		body: [
			{
				style: 'normal',
				text: 'Stand on any roof in the old city at dusk and the call to prayer does not arrive once — it arrives as weather. One minaret begins, then a second a street over, then ten more, each slightly behind or ahead, until the air itself seems to hold the note.'
			},
			{
				style: 'normal',
				text: 'This piece keeps a written log of one such evening alongside a single continuous recording. Nothing is mixed, nothing corrected. The drift between voices is the work.'
			}
		],
		credits: [
			{ role: 'Recording', names: ['Fahim Chowdhury'] },
			{ role: 'Text', names: ['Nusrat Jahan'] }
		]
	},
	{
		_id: 'work-rickshaw-alphabet',
		title: 'Rickshaw Alphabet',
		slug: 'rickshaw-alphabet',
		year: 2024,
		publishedAt: '2024-06-14T10:00:00Z',
		medium: 'Text',
		descriptors: ['Essay'],
		standfirst:
			'Twenty-six letters traced through the hand-painted typography of Dhaka’s rickshaw fleet — an essay on ornament, speed and survival.',
		cover: { file: 'cover-rickshaw-alphabet.jpg', alt: 'Brick red and orange forms with painted black strokes' },
		body: [
			{
				style: 'normal',
				text: 'Every rickshaw in this city is a manifesto in enamel paint. The painters never trained as typographers, and that is exactly why the letters live: a B that bulges like a film star’s cheek, an R with a tail long enough to seat a passenger.'
			},
			{
				style: 'normal',
				text: 'For one year we photographed every letterform we could find, sorted them into an alphabet, and asked the painters what they thought of the categories. They mostly thought the categories were funny.'
			},
			{
				style: 'normal',
				text: 'What follows is that alphabet, letter by letter, with the painters’ own commentary kept intact. It is an essay about writing systems, but it is also a ledger of a trade that may not survive the electric decade.'
			}
		],
		credits: [
			{ role: 'Text', names: ['Nusrat Jahan'] },
			{ role: 'Photography', names: ['Anika Rahman', 'Fahim Chowdhury'] }
		]
	}
];

export const openCalls = [
	{
		_id: 'opencall-mythologies-of-the-new-city',
		title: 'Mythologies of the new city',
		slug: 'mythologies-of-the-new-city',
		status: 'open',
		deadline: '2026-08-31',
		summary: 'Send work that treats Dhaka as a living myth — any medium, any scale.',
		brief: [
			{
				style: 'normal',
				text: 'Every city runs on stories it tells about itself. We are collecting work — text, photo, video, sound, software — that treats the newest parts of Dhaka as mythological ground: the metro line as river spirit, the high-rise as haunted hill.'
			},
			{
				style: 'normal',
				text: 'Selected works are produced with the collective and published here as part of the next cycle. We cover modest production costs and credit everything. Send a sketch, not a thesis.'
			}
		],
		submissionUrl: 'https://tally.so/r/placeholder',
		cover: null
	}
];

export const scraps = [
	{ _id: 'scrap-1', file: 'scrap-1.jpg', alt: 'Brick red study with ink strokes', note: 'Letterform tracing, R for rickshaw', date: '2024-03-18' },
	{ _id: 'scrap-2', file: 'scrap-2.jpg', alt: 'Grey study with a pale band', note: 'Contact sheet edge, Sadarghat fog', date: '2024-08-02' },
	{ _id: 'scrap-3', file: 'scrap-3.jpg', alt: 'Ochre square study', note: 'Pigment test for the Ledger covers', date: '2025-01-26' },
	{ _id: 'scrap-4', file: 'scrap-4.jpg', alt: 'Tall teal study', note: 'Monsoon Ledger outtake, entry 4', date: '2025-06-11' },
	{ _id: 'scrap-5', file: 'scrap-5.jpg', alt: 'Indigo study with one bright line', note: 'Night crossing, exposure rehearsal', date: '2025-10-04' },
	{ _id: 'scrap-6', file: 'scrap-6.jpg', alt: 'Moss green stacked planes', note: 'Roofline sketch for the azan log', date: '2024-11-12' },
	{ _id: 'scrap-7', file: 'scrap-7.jpg', alt: 'Marigold study with grid lines', note: 'Memory map, first street grid', date: '2026-01-20' },
	{ _id: 'scrap-8', file: 'scrap-8.jpg', alt: 'Magenta study, vertical bands', note: 'Tin roof series, colour key', date: '2026-04-07' },
	...wall.map(({ file, alt, note, date }) => ({
		_id: file.replace('.jpg', ''),
		file,
		alt,
		note,
		date
	}))
];

export const members = [
	{ _id: 'member-anika-rahman', name: 'Anika Rahman', role: 'Photography', link: 'https://instagram.com/dhakamythos', order: 0 },
	{ _id: 'member-fahim-chowdhury', name: 'Fahim Chowdhury', role: 'Film and sound', order: 1 },
	{ _id: 'member-nusrat-jahan', name: 'Nusrat Jahan', role: 'Words', order: 2 },
	{ _id: 'member-tanvir-ahmed', name: 'Tanvir Ahmed', role: 'Code', order: 3 }
];

export const legalPages = [
	{
		_id: 'legal-privacy',
		title: 'Privacy',
		slug: 'privacy',
		body: [
			{
				style: 'normal',
				text: 'This site keeps no accounts and sets no tracking cookies. Hosting infrastructure (Vercel) records standard access logs; submissions through open-call forms go to Tally and are covered by their privacy terms. Write to us to have anything you sent removed.'
			}
		]
	}
];

export const settings = {
	_id: 'siteSettings',
	siteTitle: 'DHAKAMYTHOS',
	manifesto: [
		{
			style: 'normal',
			text: 'dhakamythos is a collective making work about the city that raised us. We publish essays, photographs, films and software pieces — things to read, watch and touch — and we treat all of it as one continuous mythology of Dhaka.'
		},
		{
			style: 'normal',
			text: 'Everything here is made to be seen on a phone on a slow connection, because that is where the city reads. Open calls are how we grow; if the work above feels like a language you speak, send us something.'
		}
	],
	email: 'hello@dhakamythos.com',
	instagram: 'https://instagram.com/dhakamythos',
	cityLine: 'Dhaka, Bangladesh',
	press: []
};
