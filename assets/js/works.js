/* =========================================================================
   Bodhi Swan Ceramics — works & exhibitions data
   -------------------------------------------------------------------------
   This file is the single source of truth for every vase on the site.
   The gallery, shop, exhibitions, and piece pages all render from it.

   To add a real piece: duplicate an entry, give it a unique `id`, swap the
   `image` path for a real photo, and set `status`:

     "available"  — shown in the shop with an Add to Cart button
     "sold"       — shown in gallery + shop with a Sold badge
     "exhibition" — gallery only, labelled with its exhibition
     "collection" — gallery only (private collection / not for sale)

   `checkoutUrl` (optional): paste a Stripe Payment Link for a piece and the
   Buy button will go straight to secure card checkout for that work.
   ========================================================================= */

const WORKS = [
  {
    id: "moon-jar-i",
    title: "Moon Jar I",
    series: "Hearth",
    year: 2026,
    form: "Moon jar",
    dimensions: "34 × 30 cm",
    materials: "Stoneware, satin white glaze, wood-ash rim",
    image: "images/placeholders/vase-01.svg",
    alt: "Placeholder image of a pale satin-glazed moon jar",
    price: 640,
    status: "available",
    description:
      "A full-bellied moon jar thrown in two halves and joined at the waist. The satin white glaze breaks softly over the seam, keeping the join visible — a record of two hands bringing the form together.",
  },
  {
    id: "celadon-bottle",
    title: "Celadon Bottle",
    series: "Still Light",
    year: 2026,
    form: "Bottle vase",
    dimensions: "41 × 19 cm",
    materials: "Stoneware, celadon glaze, unglazed foot",
    image: "images/placeholders/vase-02.svg",
    alt: "Placeholder image of a green celadon bottle vase with a long neck",
    price: 420,
    status: "available",
    description:
      "A long-necked bottle for a single stem. The celadon pools at the shoulder where the form turns, deepening from sea-glass to moss. Thrown thin, but weighted at the foot so it sits with quiet certainty.",
  },
  {
    id: "ember-amphora",
    title: "Ember Amphora",
    series: "Hearth",
    year: 2025,
    form: "Amphora",
    dimensions: "38 × 24 cm",
    materials: "Iron-rich stoneware, terracotta slip, bare clay foot",
    image: "images/placeholders/vase-03.svg",
    alt: "Placeholder image of a terracotta amphora-shaped vase",
    price: 480,
    status: "available",
    description:
      "An amphora profile drawn from vessels that carried oil and grain for centuries. The terracotta slip is burnished while leather-hard, so the surface holds the warmth of the hand that rubbed it down.",
  },
  {
    id: "tenmoku-cylinder",
    title: "Tenmoku Cylinder",
    series: "Night Kiln",
    year: 2025,
    form: "Cylinder vase",
    dimensions: "36 × 15 cm",
    materials: "Dark stoneware, tenmoku glaze",
    image: "images/placeholders/vase-04.svg",
    alt: "Placeholder image of a dark tenmoku-glazed cylinder vase",
    price: 360,
    status: "sold",
    description:
      "A straight-walled cylinder in deep tenmoku that reads black until the light finds the rust at its edges. Made for branches more than blooms — structure over softness.",
  },
  {
    id: "cobalt-gourd",
    title: "Cobalt Gourd",
    series: "Still Light",
    year: 2026,
    form: "Double gourd",
    dimensions: "39 × 21 cm",
    materials: "Porcelain-stoneware blend, cobalt glaze",
    image: "images/placeholders/vase-05.svg",
    alt: "Placeholder image of a blue double-gourd vase",
    price: 520,
    status: "available",
    description:
      "A double gourd thrown in one continuous pull, the waist pinched in while the wheel still turned. The cobalt glaze settles darker in the valley between the two swells.",
  },
  {
    id: "ash-vessel",
    title: "Ash Vessel",
    series: "Hearth",
    year: 2025,
    form: "Footed bowl vase",
    dimensions: "22 × 31 cm",
    materials: "Stoneware, wood-ash glaze from studio offcuts",
    image: "images/placeholders/vase-06.svg",
    alt: "Placeholder image of a wide footed vessel with an oatmeal ash glaze",
    price: 390,
    status: "available",
    description:
      "A wide, open vessel glazed with ash from the studio's own timber offcuts — nothing anonymous about it. Each firing leaves a slightly different run down the outer wall.",
  },
  {
    id: "reed-vase",
    title: "Reed Vase",
    series: "Still Light",
    year: 2024,
    form: "Tall taper",
    dimensions: "44 × 13 cm",
    materials: "Stoneware, iron-speckled slip",
    image: "images/placeholders/vase-07.svg",
    alt: "Placeholder image of a tall slender vase with a flared lip",
    price: 340,
    status: "exhibition",
    exhibitionId: "holding-light-2026",
    description:
      "Tall and reed-thin, with a lip that flares just enough to catch the light. Part of the Holding Light exhibition; enquiries are welcome through the gallery.",
  },
  {
    id: "shoulder-jar",
    title: "Shoulder Jar",
    series: "Earth Memory",
    year: 2024,
    form: "Shouldered jar",
    dimensions: "37 × 26 cm",
    materials: "Coarse stoneware, green ash glaze",
    image: "images/placeholders/vase-08.svg",
    alt: "Placeholder image of a green jar with broad, squared shoulders",
    price: 460,
    status: "exhibition",
    exhibitionId: "holding-light-2026",
    description:
      "Broad, squared shoulders that hold the room's light along one clean edge. The coarse clay body shows through the green ash glaze at every high point.",
  },
  {
    id: "amber-baluster",
    title: "Amber Baluster",
    series: "Hearth",
    year: 2025,
    form: "Baluster vase",
    dimensions: "40 × 23 cm",
    materials: "Stoneware, amber honey glaze",
    image: "images/placeholders/vase-09.svg",
    alt: "Placeholder image of an amber-glazed baluster vase",
    price: 450,
    status: "available",
    description:
      "A classic baluster curve in a honey-amber glaze that moves like late-afternoon light. The kind of object a room arranges itself around.",
  },
  {
    id: "trumpet-vase",
    title: "Trumpet Vase",
    series: "Still Light",
    year: 2024,
    form: "Trumpet",
    dimensions: "42 × 22 cm",
    materials: "Stoneware, blush satin glaze",
    image: "images/placeholders/vase-10.svg",
    alt: "Placeholder image of a flared trumpet-shaped vase in blush tones",
    price: 380,
    status: "sold",
    description:
      "Opens like a horn from a narrow waist, made for armfuls rather than stems. The blush glaze was layered in three passes, each one fired before the next.",
  },
  {
    id: "iron-moon",
    title: "Iron Moon",
    series: "Night Kiln",
    year: 2023,
    form: "Round jar",
    dimensions: "32 × 30 cm",
    materials: "Iron-saturated stoneware, matte chocolate glaze",
    image: "images/placeholders/vase-11.svg",
    alt: "Placeholder image of a round dark-brown jar with a small mouth",
    price: null,
    status: "collection",
    description:
      "A near-spherical jar with a deliberately small mouth — a vessel that keeps more than it shows. Held in a private collection in Melbourne.",
  },
  {
    id: "rain-bottle",
    title: "Rain Bottle",
    series: "Earth Memory",
    year: 2023,
    form: "Teardrop bottle",
    dimensions: "43 × 18 cm",
    materials: "Stoneware, pale blue-grey glaze",
    image: "images/placeholders/vase-12.svg",
    alt: "Placeholder image of a teardrop-shaped vase in pale blue-grey",
    price: null,
    status: "collection",
    description:
      "A teardrop profile in a glaze mixed to the colour of Brisbane summer rain on concrete. The first piece in the Earth Memory series, kept in the studio collection.",
  },
];

const EXHIBITIONS = [
  {
    id: "holding-light-2026",
    title: "Holding Light",
    status: "current",
    venue: "Placeholder Gallery",
    location: "Brisbane, QLD",
    dates: "12 June — 18 July 2026",
    image: "images/placeholders/exhibition-room.svg",
    blurb:
      "A solo exhibition of fourteen new vessels exploring how a still form can hold moving light. Thrown over a year of early mornings, the works trace a single idea — that a vase is a pause in a room, a place where time pools.",
    workIds: ["reed-vase", "shoulder-jar"],
  },
  {
    id: "the-quiet-vessel-2025",
    title: "The Quiet Vessel",
    status: "past",
    venue: "Placeholder Project Space",
    location: "Melbourne, VIC",
    dates: "3 — 28 September 2025",
    image: "images/placeholders/exhibition-room.svg",
    blurb:
      "A two-person show pairing wheel-thrown vases with woven works, asking what handmade objects offer a world of anonymous production. Iron Moon was acquired for a private collection from this exhibition.",
    workIds: ["iron-moon", "tenmoku-cylinder"],
  },
  {
    id: "clay-bodies-2024",
    title: "Clay Bodies — Group Show",
    status: "past",
    venue: "Placeholder Art Centre",
    location: "Brisbane, QLD",
    dates: "8 — 30 March 2024",
    image: "images/placeholders/exhibition-room.svg",
    blurb:
      "An annual survey of Queensland ceramic artists. Rain Bottle and Trumpet Vase represented the studio's first exhibited series, Earth Memory.",
    workIds: ["rain-bottle", "trumpet-vase"],
  },
];

/* Pieces highlighted on the home page, in order. */
const FEATURED_IDS = ["moon-jar-i", "cobalt-gourd", "ember-amphora"];
