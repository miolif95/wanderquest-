"use client";

import dynamic from "next/dynamic";

/**
 * Wrapper Client Component per il dynamic import con ssr:false di
 * QuestMap. Next.js (App Router) non permette più `ssr: false` in
 * `next/dynamic` chiamato direttamente dentro un Server Component - va
 * spostato in un Client Component come questo, che la pagina server
 * (page.tsx) importa normalmente.
 */
const QuestMap = dynamic(() => import("./quest-map"), { ssr: false });

export default QuestMap;
