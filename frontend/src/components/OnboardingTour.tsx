"use client";

import { useEffect, useState, useRef } from "react";
import type { WorkerPublic } from "@/types/worker_types";

interface OnboardingTourProps {
  isOpen: boolean;
  user: WorkerPublic | null;
  onComplete: () => void;
}

export default function OnboardingTour({
  isOpen,
  user,
  onComplete,
}: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    nextBtnRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Escape doesn't close to prevent accidental exit, use Skip instead
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!isOpen || !user) return null;

  // 6 steps onboarding for standard worker
  const steps = [
    {
      title: "Witaj we FleetManager!",
      description: `Witaj, ${user.name}! Twój profil pracownika został pomyślnie utworzony. Przygotowaliśmy ten krótki, 6-etapowy przewodnik, który pomoże Ci w pełni poznać możliwości naszego systemu zarządzania flotą.`,
      icon: (
        <svg className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Powitanie</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      title: "Przegląd Floty Pojazdów",
      description: "W zakładce 'Pojazdy' znajdziesz spis wszystkich samochodów służbowych w firmie. Możesz przeglądać ich szczegóły, status dostępności w czasie rzeczywistym oraz przypisanych opiekunów.",
      icon: (
        <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Flota</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: "Pakiety Wyposażenia",
      description: "Każdy samochód we flocie posiada przypisany zestaw wyposażenia. Przed podróżą możesz sprawdzić, czy dane auto ma na pokładzie GPS, klimatyzację, tempomat czy podgrzewane fotele.",
      icon: (
        <svg className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Wyposażenie</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Szybkie Rezerwacje",
      description: "Potrzebujesz auta na podróż służbową? Wystarczy wybrać pojazd, zaznaczyć interesujące Cię dni w interaktywnym kalendarzu, wpisać cel wyjazdu i zatwierdzić. System automatycznie sprawdzi kolizje terminów.",
      icon: (
        <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Rezerwacje</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Twoje Rezerwacje pod kontrolą",
      description: "W sekcji 'Rezerwacje' masz pełen wgląd w swoje aktualne, przeszłe oraz planowane wyjazdy. Stąd również możesz zarządzać szczegółami rezerwacji i w razie konieczności anulować przejazd.",
      icon: (
        <svg className="h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Status</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: "Profil i Zmiana Hasła",
      description: "Pamiętaj, by dbać o bezpieczeństwo swojego konta. W sekcji 'Profil' możesz w każdej chwili dokonać szybkiej zmiany hasła. To wszystko! Życzymy szerokiej drogi i bezproblemowych wyjazdów.",
      icon: (
        <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <title>Bezpieczeństwo</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        className="absolute inset-0"
        onClick={onComplete}
        aria-hidden="true"
      />

      <div
        className="glass-overlay rounded-[2rem] w-full max-w-xl p-8 sm:p-10 relative z-10 shadow-[0_0_50px_rgba(139,92,246,0.3)] border-purple-500/20 text-center flex flex-col items-center justify-between min-h-[420px] transition-all duration-300 transform scale-100"
      >
        {/* Skip button top-right */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full"
        >
          Pomiń
        </button>

        {/* Dynamic Icon with glowing background */}
        <div className="flex flex-col items-center mt-4 w-full">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
            style={{
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            {currentStep.icon}
          </div>

          {/* Title & Description */}
          <h2
            className="text-2xl font-black text-white mb-4 tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, var(--color-accent-soft) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {currentStep.title}
          </h2>
          
          <p
            className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md font-medium min-h-[96px] flex items-center justify-center"
          >
            {currentStep.description}
          </p>
        </div>

        {/* Footer controls: dots, Prev/Next buttons */}
        <div className="w-full flex flex-col items-center gap-6 mt-6">
          {/* Progress dots */}
          <div className="flex gap-2 justify-center">
            {steps.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => {
                  const idx = steps.findIndex((x) => x.title === s.title);
                  if (idx !== -1) setStep(idx);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  steps[step].title === s.title
                    ? "w-8 bg-purple-500 shadow-[0_0_10px_var(--color-accent)]"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Przejdź do kroku: ${s.title}`}
              />
            ))}
          </div>

          <div className="w-full flex justify-between items-center pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 0}
              className={`btn-ghost text-xs uppercase tracking-wider !px-4 !py-2.5 ${
                step === 0 ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              Wstecz
            </button>

            <span className="text-xs text-gray-500 font-bold">
              Krok {step + 1} z {steps.length}
            </span>

            <button
              ref={nextBtnRef}
              type="button"
              onClick={handleNext}
              className="btn-primary text-xs uppercase tracking-wider !px-6 !py-2.5 flex items-center gap-2"
            >
              {step === steps.length - 1 ? (
                <>
                  Rozpocznij
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <title>Zakończ</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  Dalej
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <title>Dalej</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
