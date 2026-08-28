"use client";

import { useRouter } from "next/navigation";
import { ProfileEditForm } from "@/components/profile-edit-form";

/**
 * Wrapper Client Component per /onboarding/profile (Change Request
 * "Guida, Profilo, Livelli", Sezione 3.3): serve solo a fornire la
 * navigazione post-salvataggio/skip a ProfileEditForm, che una Server
 * Component non può passare come funzione (i props da Server a Client
 * Component devono essere serializzabili) - stesso motivo per cui
 * quest-map-client.tsx esiste accanto a quest-map.tsx (Fase 8).
 */
export function OnboardingProfileClient({
  userId,
  initialAvatarUrl,
  initialBio,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
}) {
  const router = useRouter();

  function goHome() {
    router.push("/");
    router.refresh();
  }

  return (
    <ProfileEditForm
      userId={userId}
      initialAvatarUrl={initialAvatarUrl}
      initialBio={initialBio}
      onSaved={goHome}
      onSkip={goHome}
    />
  );
}
