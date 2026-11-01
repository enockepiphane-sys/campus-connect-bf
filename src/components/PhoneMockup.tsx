import studentScreen from "@/assets/student-screen.webp";

// Téléphone de l'accueil : affiche l'écran réel et moderne de l'espace étudiant.
export function PhoneMockup() {
  return (
    <div
      className="mx-auto w-[150px] rounded-[1.8rem] bg-[#1a1a1a] p-2 sm:w-[180px] md:w-[215px]"
      style={{ boxShadow: "0 40px 70px -25px rgba(0,0,0,0.45), 0 12px 30px -18px rgba(0,0,0,0.35)" }}
    >
      <div className="relative overflow-hidden rounded-[1.5rem] bg-white">
        {/* Caméra du téléphone */}
        <div className="absolute left-1/2 top-1.5 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
        <img
          src={studentScreen}
          alt="Aperçu de l'espace étudiant CampusLink : prochain cours, moyenne, emploi du temps de la semaine et annonces"
          width={720}
          height={1496}
          loading="eager"
          decoding="async"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}
