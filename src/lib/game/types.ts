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
  /** Titolo del nuovo livello (Change Request "Guida, Profilo, Livelli", Sezione 2.3), da evidenziare nel messaggio di level-up. */
  newLevelTitle: string;
  achievementsUnlocked: UnlockedAchievement[];
  wanderstamp: {
    destinationId: string;
    questsCompleted: number;
    xpEarned: number;
  };
  /** quests.completion_fact della Quest appena completata, o null se non impostato in admin (Sezione 2.2/3.2). */
  completionFact: string | null;
};
