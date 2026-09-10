import { useLanguage } from "@/app/language-context";

export default function DemoPage() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-4 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">{es ? "Demo" : "Demo"}</h1>
      <p className="max-w-2xl text-center text-sm text-neutral-400">
        {es
          ? "Grabación real del flujo completo sobre un voluntario registrado de verdad: onboarding, chat de ayuda, matching en vivo, aprobación manual y la página de evaluación."
          : "Real recording of the full flow against an actually-registered volunteer: onboarding, help chat, live matching, the manual approval panel and the evaluation page."}
      </p>
      <video controls preload="metadata" className="max-w-3xl w-full rounded-lg border border-neutral-800 shadow-2xl">
        <source src="/one-hour-demo.mp4" type="video/mp4" />
        {es ? "Tu navegador no soporta el tag de video." : "Your browser does not support the video tag."}
      </video>
    </main>
  );
}