import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dir, "../../.env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log("Loaded .env from project root");
} catch {
  console.log("No .env file found — using environment variables directly");
}

const { db } = await import("@workspace/db");
const { cardsTable, packsTable, packCardsTable } = await import("@workspace/db/schema");

// =============================================
// CARDS
// =============================================
const cards = [
  // Pokemon - Common
  { name: "Rattata", franchise: "pokemon" as const, rarity: "common" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/19.png", description: "A common Normal-type Pokemon." },
  { name: "Pidgey", franchise: "pokemon" as const, rarity: "common" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png", description: "A common Normal/Flying-type Pokemon." },
  { name: "Caterpie", franchise: "pokemon" as const, rarity: "common" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png", description: "A common Bug-type Pokemon." },
  { name: "Weedle", franchise: "pokemon" as const, rarity: "common" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/13.png", description: "A common Bug/Poison-type Pokemon." },
  // Pokemon - Rare
  { name: "Bulbasaur", franchise: "pokemon" as const, rarity: "rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png", description: "The Grass/Poison starter Pokemon." },
  { name: "Charmander", franchise: "pokemon" as const, rarity: "rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png", description: "The Fire starter Pokemon." },
  { name: "Squirtle", franchise: "pokemon" as const, rarity: "rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png", description: "The Water starter Pokemon." },
  // Pokemon - Super Rare
  { name: "Gengar", franchise: "pokemon" as const, rarity: "super_rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png", description: "A Ghost/Poison-type Pokemon that loves to scare." },
  { name: "Dragonite", franchise: "pokemon" as const, rarity: "super_rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png", description: "A powerful Dragon/Flying-type Pokemon." },
  { name: "Alakazam", franchise: "pokemon" as const, rarity: "super_rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png", description: "A Psychic-type Pokemon with incredible intellect." },
  // Pokemon - Ultra Rare
  { name: "Charizard", franchise: "pokemon" as const, rarity: "ultra_rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png", description: "The iconic Fire/Flying powerhouse." },
  { name: "Mewtwo", franchise: "pokemon" as const, rarity: "ultra_rare" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png", description: "A genetically engineered Psychic-type Pokemon." },
  // Pokemon - Legendary
  { name: "Lugia", franchise: "pokemon" as const, rarity: "legendary" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png", description: "The guardian of the seas — a Psychic/Flying legendary." },
  { name: "Ho-Oh", franchise: "pokemon" as const, rarity: "legendary" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png", description: "The guardian of the skies — a Fire/Flying legendary." },
  { name: "Rayquaza", franchise: "pokemon" as const, rarity: "legendary" as const, imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png", description: "The Sky High Pokemon — Dragon/Flying legendary." },
  // One Piece - Common
  { name: "Marine Grunt", franchise: "onepiece" as const, rarity: "common" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "A common Marine foot soldier." },
  { name: "East Blue Pirate", franchise: "onepiece" as const, rarity: "common" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "A low-ranked pirate from the East Blue." },
  { name: "Alvida", franchise: "onepiece" as const, rarity: "common" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Iron Mace Alvida of the Alvida Pirates." },
  { name: "Koby", franchise: "onepiece" as const, rarity: "common" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Koby, a Marine in training." },
  // One Piece - Rare
  { name: "Roronoa Zoro", franchise: "onepiece" as const, rarity: "rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The Pirate Hunter — Straw Hat first mate." },
  { name: "Nami", franchise: "onepiece" as const, rarity: "rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Cat Burglar Nami — the Straw Hat navigator." },
  { name: "Usopp", franchise: "onepiece" as const, rarity: "rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "God Usopp — sniper of the Straw Hat crew." },
  // One Piece - Super Rare
  { name: "Trafalgar Law", franchise: "onepiece" as const, rarity: "super_rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The Surgeon of Death — Captain of the Heart Pirates." },
  { name: "Boa Hancock", franchise: "onepiece" as const, rarity: "super_rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The Pirate Empress and Snake Princess of Amazon Lily." },
  { name: "Ace", franchise: "onepiece" as const, rarity: "super_rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Portgas D. Ace — Fire Fist, commander of the 2nd division." },
  // One Piece - Ultra Rare
  { name: "Monkey D. Luffy", franchise: "onepiece" as const, rarity: "ultra_rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The future King of the Pirates — user of Gomu Gomu no Mi." },
  { name: "Whitebeard", franchise: "onepiece" as const, rarity: "ultra_rare" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Edward Newgate — the strongest man in the world." },
  // One Piece - Legendary
  { name: "Shanks", franchise: "onepiece" as const, rarity: "legendary" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "Red-Haired Shanks — one of the Four Emperors." },
  { name: "Gol D. Roger", franchise: "onepiece" as const, rarity: "legendary" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The Pirate King — the man who conquered the Grand Line." },
  { name: "Rocks D. Xebec", franchise: "onepiece" as const, rarity: "legendary" as const, imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg", description: "The most dangerous man in history — rival to Roger himself." },
];

// =============================================
// PACKS
// =============================================
const packs = [
  {
    name: "Pokemon Base Set",
    franchise: "pokemon" as const,
    priceIdr: 15000,
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    description: "Classic Pokemon cards — a mix of commons through rares.",
    isActive: true,
  },
  {
    name: "Pokemon Legendary",
    franchise: "pokemon" as const,
    priceIdr: 75000,
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png",
    description: "Premium pack with higher chances of ultra rare and legendary Pokemon.",
    isActive: true,
  },
  {
    name: "One Piece Grand Line",
    franchise: "onepiece" as const,
    priceIdr: 20000,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg",
    description: "Start your journey on the Grand Line with common to rare crew members.",
    isActive: true,
  },
  {
    name: "One Piece Emperor",
    franchise: "onepiece" as const,
    priceIdr: 100000,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece_ch1.jpg",
    description: "The mightiest pack — featuring Emperor-tier legendary cards.",
    isActive: true,
  },
];

// =============================================
// SEED
// =============================================
console.log("Seeding cards...");
const existingCards = await db.select().from(cardsTable).limit(1);
let insertedCards;
if (existingCards.length > 0) {
  console.log("Cards already exist — skipping card seed.");
  insertedCards = await db.select().from(cardsTable);
} else {
  insertedCards = await db.insert(cardsTable).values(cards).returning();
  console.log(`Inserted ${insertedCards.length} cards.`);
}

console.log("Seeding packs...");
const existingPacks = await db.select().from(packsTable).limit(1);
let insertedPacks;
if (existingPacks.length > 0) {
  console.log("Packs already exist — skipping pack seed.");
  insertedPacks = await db.select().from(packsTable);
} else {
  insertedPacks = await db.insert(packsTable).values(packs).returning();
  console.log(`Inserted ${insertedPacks.length} packs.`);
}

// Helper
const byFranchise = (f: "pokemon" | "onepiece") => insertedCards.filter(c => c.franchise === f);
const byRarity = (cards: typeof insertedCards, r: string) => cards.filter(c => c.rarity === r);

// Pack-card assignments with probabilities
const existingPackCards = await db.select().from(packCardsTable).limit(1);
if (existingPackCards.length > 0) {
  console.log("Pack cards already exist — skipping.");
} else {
  const pokemonCards = byFranchise("pokemon");
  const opCards = byFranchise("onepiece");

  const packCardRows: { packId: number; cardId: number; probability: string }[] = [];

  for (const pack of insertedPacks) {
    const sourceCards = pack.franchise === "pokemon" ? pokemonCards : opCards;
    const isLegendaryPack = pack.name.includes("Legendary") || pack.name.includes("Emperor");

    // Probability by rarity
    const probMap: Record<string, string> = isLegendaryPack
      ? { common: "0.05", rare: "0.15", super_rare: "0.30", ultra_rare: "0.30", legendary: "0.20" }
      : { common: "0.45", rare: "0.30", super_rare: "0.15", ultra_rare: "0.07", legendary: "0.03" };

    for (const rarity of ["common", "rare", "super_rare", "ultra_rare", "legendary"]) {
      const rarityCards = byRarity(sourceCards, rarity);
      for (const card of rarityCards) {
        packCardRows.push({ packId: pack.id, cardId: card.id, probability: probMap[rarity] });
      }
    }
  }

  await db.insert(packCardsTable).values(packCardRows);
  console.log(`Inserted ${packCardRows.length} pack-card assignments.`);
}

console.log("\nSeed selesai!");
process.exit(0);
