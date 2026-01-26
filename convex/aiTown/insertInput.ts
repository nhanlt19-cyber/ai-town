import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { engineInsertInput } from '../engine/abstractGame';
import { InputNames, InputArgs } from './inputs';

export async function insertInput<Name extends InputNames>(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  name: Name,
  args: InputArgs<Name>,
): Promise<Id<'inputs'>> {
  // Try to find worldStatus by index first
  let worldStatus = await ctx.db
    .query('worldStatus')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .unique();
  
  // If not found by index, try to find by filter (fallback)
  if (!worldStatus) {
    worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('worldId'), worldId))
      .first();
  }
  
  if (!worldStatus) {
    // Check if world exists
    const world = await ctx.db.get(worldId);
    if (!world) {
      throw new Error(`World ${worldId} does not exist. The world may have been deleted.`);
    }
    
    // World exists but no worldStatus - try to find by isDefault
    // This can happen if worldStatus was deleted but world still exists
    const defaultWorldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    
    if (defaultWorldStatus && defaultWorldStatus.worldId === worldId) {
      // Found it by isDefault, use it
      worldStatus = defaultWorldStatus;
    } else {
      // World exists but no worldStatus - this is a data inconsistency
      throw new Error(
        `WorldStatus not found for world ${worldId}. ` +
        `The world exists but its status record is missing. ` +
        `This may indicate a data inconsistency. ` +
        `Try running 'testing:wipeAllTables' and 'init' to recreate the world, ` +
        `or check the Convex Dashboard to see if worldStatus was accidentally deleted.`
      );
    }
  }
  
  // Verify engine exists
  const engine = await ctx.db.get(worldStatus.engineId);
  if (!engine) {
    throw new Error(
      `Engine ${worldStatus.engineId} not found for world ${worldId}. ` +
      `This may indicate a data inconsistency. ` +
      `Try running 'testing:wipeAllTables' and 'init' to recreate the world.`
    );
  }
  
  return await engineInsertInput(ctx, worldStatus.engineId, name, args);
}
