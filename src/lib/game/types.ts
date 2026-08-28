/** Achievement come restituito da complete_quest() e mostrato nella Completion Screen. */
export type UnlockedAchievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
};

/**
 * Risposta di /api/quests/:questId/complete (Sezione 8 della spec
 * tecnica, tipo CompleteQuestResponse).
 */
export type CompleteQuestResponse = {
  xpGained: number;
  totalXp: number;
  leveledUp: boolean;
  newLevel: number;
  achievementsUnlocked: UnlockedAchievement[];
  wanderstamp: {
    destinationId: string;
    questsCompleted: number;
    xpEarned: number;
  };
};
