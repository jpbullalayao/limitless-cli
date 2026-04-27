import { z } from 'zod';

/** GET /games item */
export const gameItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  // TODO(per-game): refine when testing API calls for PTCG/POCKET; see NEXT_STEPS.md
  formats: z.record(z.string()).optional(),
  // TODO(per-game): refine when testing API calls for PTCG/POCKET; see NEXT_STEPS.md
  platforms: z.record(z.string()).optional(),
  metagame: z.boolean().optional(),
});

export const gameListSchema = z.array(gameItemSchema);

const cardRuleSchema = z
  .object({
    count: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    set: z.string().optional(),
    number: z.string().optional(),
  })
  .passthrough();

const variantSchema = z
  .object({
    identifier: z.string().nullable(),
    name: z.string().nullable(),
    icon: z.string().optional(),
    cards: z.array(cardRuleSchema).optional(),
  })
  .passthrough();

/** GET /games/{id}/decks item */
export const gameDeckRuleSchema = z
  .object({
    identifier: z.string().nullable(),
    name: z.string().nullable(),
    cards: z.array(cardRuleSchema).optional(),
    priority: z.number().optional(),
    variants: z.array(variantSchema).optional(),
    icons: z.array(z.string()).optional(),
    generation: z.number().optional(),
  })
  .passthrough();

export const gameDecksSchema = z.array(gameDeckRuleSchema);
