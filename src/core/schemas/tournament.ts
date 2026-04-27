import { z } from 'zod';

/** GET /tournaments list item */
export const tournamentListItemSchema = z.object({
  id: z.string(),
  game: z.string(),
  format: z.string().nullable().optional(),
  name: z.string(),
  date: z.string(),
  players: z.number().optional(),
});

export const tournamentListSchema = z.array(tournamentListItemSchema);

const organizerSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().optional(),
});

const phaseSchema = z.object({
  phase: z.number(),
  type: z.string(),
  rounds: z.number(),
  mode: z.string(),
});

/** GET /tournaments/{id}/details */
export const tournamentDetailsSchema = z.object({
  id: z.string(),
  game: z.string(),
  format: z.string().nullable().optional(),
  name: z.string(),
  date: z.string(),
  players: z.number().optional(),
  organizer: organizerSchema.optional(),
  platform: z.string().optional(),
  decklists: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  phases: z.array(phaseSchema).optional(),
  // TODO(per-game): VGC omits these fields; refine from API samples for games that return them; see NEXT_STEPS.md
  bannedCards: z.array(z.unknown()).optional(),
  specialRules: z.array(z.string()).optional(),
});

const recordSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  ties: z.number().optional(),
});

const deckSummarySchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    icons: z.array(z.string()).optional(),
  })
  .passthrough();

export const vgcDecklistPokemonSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    item: z.string(),
    ability: z.string(),
    attacks: z.array(z.string()),
    tera: z.string().nullable(),
  })
  .passthrough();

export const vgcDecklistSchema = z.array(vgcDecklistPokemonSchema);

/** GET /tournaments/{id}/standings row */
export const standingRowSchema = z.object({
  player: z.string(),
  name: z.string().optional(),
  country: z.string().nullable().optional(),
  placing: z.number().nullable().optional(),
  record: recordSchema.optional(),
  // VGC decklist is typed; other games fall back via z.unknown(); see NEXT_STEPS.md
  decklist: z.union([vgcDecklistSchema, z.unknown()]).optional(),
  // TODO(per-game): refine when testing API calls for PTCG/VGC/POCKET; see NEXT_STEPS.md
  deck: z
    .union([deckSummarySchema, z.object({}).passthrough()])
    .optional()
    .nullable(),
  drop: z.number().nullable().optional(),
});

export const standingsSchema = z.array(standingRowSchema);

/** GET /tournaments/{id}/pairings row */
export const pairingRowSchema = z
  .object({
    round: z.number(),
    phase: z.number(),
    table: z.union([z.number(), z.null()]).optional(),
    match: z.string().optional(),
    player1: z.string().optional(),
    player2: z.string().optional(),
    winner: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const pairingsSchema = z.array(pairingRowSchema);
