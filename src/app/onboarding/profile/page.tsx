import { requireUser } from "@/lib/auth/require-user";
import { OnboardingProfileClient } from "./onboarding-profile-client";

/**
 * Onboarding del profilo (Change Request "Guida, Profilo, Livelli",
 * Sezione 3.3), mostrata subito dopo il primo login: foto + bio,
 * completamente saltabile - principio "Low Friction" del PRD, un profilo
 * incompleto non deve bloccare l'accesso al resto dell'app. Il trigger di
 * navigazione verso questa pagina è in /login (Sezione 3.3 non impone un
 * meccanismo specifico, solo che sia "subito dopo la registrazione" - dato
 * che qui la conferma email è obbligatoria, il primo momento in cui esiste
 * davvero una sessione è il primo login riuscito, non la sottomissione del
 * form di registrazione).
 */
export default async function OnboardingProfilePage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <h1 className="text-xl font-bold text-white">Personalizza il tuo profilo</h1>
      <p className="mt-1 text-sm text-gray-400">
        Aggiungi una foto e una breve bio, oppure salta e fallo più tardi da Profilo.
      </p>
      <div className="mt-6">
        <OnboardingProfileClient
          userId={user.id}
          initialAvatarUrl={profile?.avatar_url ?? null}
          initialBio={profile?.bio ?? null}
        />
      </div>
    </main>
  );
}
