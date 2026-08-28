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

/**
 * Titoli di livello (Change Request "Guida, Profilo, Livelli", Sezione
 * 2.3): un nome invece del solo numero, mostrato ovunque oggi si vede il
 * livello (Home, Profile, Completion Screen - Sezione 3.4). Oltre l'ultimo
 * titolo definito si ripete "Globetrotter" per ogni livello successivo:
 * è lo stesso placeholder già previsto dal Technical Spec (Sezione 17,
 * "Formula livello oltre il Livello 5") applicato anche ai titoli, non una
 * scelta nuova di questa estensione.
 */
export const LEVEL_TITLES = ["Neofita", "Esploratore", "Viandante", "Avventuriero", "Globetrotter"];

/** Titolo testuale corrispondente a un livello numerico. */
export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1];
}

/**
 * Riepilogo di progresso verso il prossimo livello, usato ovunque oggi si
 * mostrerebbe il livello come solo numero (Sezione 3.4): un unico punto di
 * calcolo per titolo/XP-nel-livello/percentuale, così Home, Profile e
 * Completion Screen non possono mai mostrare valori divergenti tra loro.
 */
export function getLevelProgress(xp: number) {
  const level = getLevel(xp);
  const currentThreshold =
    LEVEL_THRESHOLDS[level - 1] ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length) * 1000;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 1000;
  return {
    title: getLevelTitle(level),
    level,
    xpIntoLevel: xp - currentThreshold,
    xpForNextLevel: nextThreshold - currentThreshold,
    progressRatio: Math.min(1, (xp - currentThreshold) / (nextThreshold - currentThreshold)),
  };
}
