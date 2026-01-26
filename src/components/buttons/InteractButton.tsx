import Button from './Button';
import { toast } from 'react-toastify';
import interactImg from '../../../assets/interact.svg';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
// import { SignInButton } from '@clerk/clerk-react';
import { ConvexError } from 'convex/values';
import { Id } from '../../../convex/_generated/dataModel';
import { useCallback, useState } from 'react';
import { waitForInput } from '../../hooks/sendInput';
import { useServerGame } from '../../hooks/serverGame';

export default function InteractButton() {
  // const { isAuthenticated } = useConvexAuth();
  const [isJoining, setIsJoining] = useState(false);
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const humanTokenIdentifier = useQuery(api.world.userStatus, worldId ? { worldId } : 'skip');
  const userPlayerId =
    game && humanTokenIdentifier
      ? [...game.world.players.values()].find((p) => p.human === humanTokenIdentifier)?.id
      : undefined;
  const join = useMutation(api.world.joinWorld);
  const leave = useMutation(api.world.leaveWorld);
  const isPlaying = !!userPlayerId;

  const convex = useConvex();
  const joinInput = useCallback(
    async (worldId: Id<'worlds'>) => {
      setIsJoining(true);
      let inputId;
      try {
        console.log(`Calling joinWorld mutation for world ${worldId}`);
        inputId = await join({ worldId });
        console.log(`Join mutation returned inputId: ${inputId}`);
      } catch (e: any) {
        setIsJoining(false);
        if (e instanceof ConvexError) {
          console.error('Join error:', e.data);
          toast.error(e.data);
          return;
        }
        console.error('Unexpected join error:', e);
        toast.error(`Failed to join: ${e.message || 'Unknown error'}`);
        return;
      }
      try {
        console.log(`Waiting for input ${inputId} to complete... (timeout: 30s)`);
        // Use 30 second timeout for join - gives engine more time if overloaded
        // But we'll still check if player was created even if input times out
        try {
          await waitForInput(convex, inputId, 30000);
          console.log(`Input ${inputId} completed successfully`);
          toast.success('Successfully joined the game!');
        } catch (timeoutError: any) {
          console.warn('Input timeout, but player might still be created:', timeoutError.message);
          // Even if input times out, wait a bit more for state to update
          // Engine might be slow but still processing
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s for state to update
          toast.warning(
            'Join may still be processing. Please wait a moment and refresh the page to check if you joined successfully.'
          );
        }
        // Give the game state a moment to update
        setTimeout(() => {
          setIsJoining(false);
        }, 500);
      } catch (e: any) {
        setIsJoining(false);
        console.error('WaitForInput error:', e);
        const errorMsg = e.message || 'Failed to complete join';
        // Don't show error if it's just a timeout - player might still be created
        if (!errorMsg.includes('timed out')) {
          toast.error(errorMsg);
        } else {
          toast.warning('Join may have succeeded. Please refresh the page to check.');
        }
        // If timeout, suggest checking engine status
        if (errorMsg.includes('timed out')) {
          console.warn('Engine may be overloaded. Player might still be created. Refresh page to check.');
        }
      }
    },
    [convex, join],
  );

  const joinOrLeaveGame = () => {
    console.log('joinOrLeaveGame called', {
      worldId,
      game: game !== undefined,
      isPlaying,
      isJoining,
      humanTokenIdentifier,
      userPlayerId,
    });

    if (!worldId) {
      console.warn('No worldId available');
      toast.error('World not available. Please wait...');
      return;
    }

    if (game === undefined) {
      console.warn('Game is still loading');
      toast.error('Game is still loading. Please wait...');
      return;
    }

    if (isJoining) {
      console.log('Already joining, ignoring click');
      return;
    }

    if (isPlaying) {
      console.log(`Leaving game for player ${userPlayerId}`);
      void leave({ worldId }).catch((e: any) => {
        console.error('Leave error:', e);
        toast.error(`Failed to leave: ${e.message || 'Unknown error'}`);
      });
    } else {
      console.log(`Joining game`);
      void joinInput(worldId);
    }
  };

  const isDisabled = !worldId || game === undefined || isJoining;
  const buttonText = isJoining ? 'Joining...' : isPlaying ? 'Leave' : 'Interact';

  // if (!isAuthenticated || game === undefined) {
  //   return (
  //     <SignInButton>
  //       <Button imgUrl={interactImg}>Interact</Button>
  //     </SignInButton>
  //   );
  // }
  return (
    <Button
      imgUrl={interactImg}
      onClick={joinOrLeaveGame}
      title={isDisabled ? 'Please wait for the game to load...' : undefined}
    >
      {buttonText}
    </Button>
  );
}
