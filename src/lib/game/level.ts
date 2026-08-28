/**
 * Motore XP/livelli (Sezione 6.1 della spec tecnica). Condiviso tra le
 * pagine di lettura (Fase 4) e il motore di completamento Quest (Fase 6):
 * il livello NON è mai memorizzato a database, si calcola sempre da qui a
 * partire da profiles.xp, per evitare che possa disallinearsi.
 */

/** XP assegnati per difficoltà, usati dal pannello admin come riferimento. */
export const XP_REWARD = { EASY: 50, MEDIUM: 100, HARD: 200 } as const;

/** Soglie di XP per livello: indice 0 corrisponde al livello 1. */
export const LEVEL_THRESHOLDS = [0, 500, 1000, 1750, 2500];

/**
 * Calcola il livello a partire dagli XP totali. Oltre il livello 5 (che è
 * l'ultimo definito esplicitamente dal PRD) applica un placeholder di
 * +1000 XP per livello, da bilanciare in futuro con dati reali d'uso
 * (Sezione 17, nota "Formula livello oltre il Livello 5").
 */
export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (xp > last) {
    level += Math.floor((xp - last) / 1000);
  }
  return level;
}

/** XP necessari per raggiungere il prossimo livello, o null oltre le soglie definite (progressione lineare). */
export function xpForNextLevel(xp: number): number | null {
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t > xp);
  if (nextThreshold !== undefined) return nextThreshold;
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const stepsAboveLast = Math.floor((xp - last) / 1000) + 1;
  return last + stepsAboveLast * 1000;
}
