import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";
import { createServiceClient } from "@/lib/supabase/server";

// Precisa ser dinâmica: o botão de agendar deve refletir a pausa de
// atendimentos assim que o admin muda, sem esperar um novo deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createServiceClient();
  const { data: settingsRow } = await supabase
    .from("booking_settings")
    .select("booking_paused")
    .eq("id", 1)
    .single();
  const paused = settingsRow?.booking_paused ?? false;

  return (
    <main>
      {/* Nav simples */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto gap-3">
        <span className="font-display font-semibold text-lg text-[var(--color-teal-dark)]">
          Aline Vicente Consultoria
        </span>
        {paused ? (
          <span className="rounded-full bg-gray-200 text-gray-500 text-sm font-semibold px-5 py-2.5 whitespace-nowrap cursor-not-allowed">
            Agendamentos pausados
          </span>
        ) : (
          <Link
            href="/agendar"
            className="rounded-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white text-sm font-semibold px-5 py-2.5 whitespace-nowrap"
          >
            Agendar sessão
          </Link>
        )}
      </header>

      {/* Sobre a Aline — logo no início, identidade em destaque */}
      <section className="border-t-4 border-[var(--color-teal)] pt-14 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--color-ink)] mb-2">
            Um espaço para conversar, entender e encontrar caminhos
          </h1>
          <div className="w-16 h-1 bg-[var(--color-blue-accent)] rounded-full mx-auto mb-10" />

          <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto mb-10 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
            <Image
              src="/aline-photo.png"
              alt="Aline Vicente"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="text-left text-[var(--color-ink-soft)] leading-relaxed flex flex-col gap-5 text-[15px] sm:text-base">
            <p>
              Ser mãe traz muitas dúvidas — especialmente quando estamos tentando compreender
              nossos filhos, seus comportamentos e também tudo o que essa jornada desperta em nós.
            </p>
            <p>
              Sou mãe, terapeuta comportamental e mestranda em Applied Behavior Analysis (ABA).
              Minha experiência une dois lados que fazem parte da minha vida todos os dias: o
              olhar de uma mãe e o conhecimento que venho construindo profissional e
              academicamente na área do comportamento.
            </p>
            <p>
              Criei esta mentoria para mães que sentem que precisam conversar com alguém que
              entenda esse contexto e possa ajudá-las a organizar suas dúvidas e pensar em
              possibilidades.
            </p>
            <p>Durante nosso encontro, podemos conversar sobre questões como:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>comportamentos que estão sendo difíceis de compreender ou manejar no dia a dia;</li>
              <li>rotina, autonomia e desafios familiares;</li>
              <li>dúvidas sobre ABA, terapias e estratégias comportamentais;</li>
              <li>comunicação e relacionamento com profissionais e escola;</li>
              <li>maternidade e os desafios que você está vivendo;</li>
              <li>
                ou simplesmente uma situação específica em que você precisa de orientação e de um
                novo olhar.
              </li>
            </ul>

            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mt-4">
              Como funciona
            </h2>
            <p>
              A mentoria é uma conversa individual e personalizada. Você traz aquilo que está
              vivendo e, durante 45 minutos, vamos conversar sobre suas dúvidas, organizar o que
              está acontecendo e pensar juntas em caminhos possíveis.
            </p>
          </div>
        </div>
      </section>

      {/* CTA de agendamento */}
      <section className="bg-[var(--color-teal)] px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block rounded-full bg-white/15 text-[var(--color-orange)] text-xs font-bold tracking-wide px-4 py-1.5 mb-5">
            SESSÕES 100% ONLINE
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-4">
            Vamos conversar sobre a rotina da sua família?
          </h2>
          <p className="text-white/85 mb-8">
            Sessões individuais de mentoria, com base em evidências científicas e na vivência de
            quem passa por isso todos os dias.
          </p>
          {paused ? (
            <p className="inline-block rounded-full bg-white/15 text-white/70 font-medium px-8 py-3.5">
              Atendimentos pausados no momento — volte em breve
            </p>
          ) : (
            <Link
              href="/agendar"
              className="inline-block rounded-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white font-semibold px-8 py-3.5"
            >
              Ver horários disponíveis →
            </Link>
          )}
          <div>
            <Link
              href="/agendar/consultar"
              className="inline-block mt-4 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white font-medium px-6 py-2.5 text-sm border border-white/30"
            >
              Consultar agendamento
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 py-16 bg-[var(--color-teal-light)] text-center">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-2">
            Receba novidades por e-mail
          </h2>
          <p className="text-[var(--color-ink-soft)] text-sm mb-6">
            Avisos de aulões, conteúdo novo e novidades da Aline direto na sua caixa de entrada.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Conecte-se comigo */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-10">
          Conecte-se Comigo
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            {
              label: "YouTube",
              href: "https://www.youtube.com/@AlineVicente",
              bg: "#FF0000",
              icon: (
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z" />
                </svg>
              ),
            },
            {
              label: "Instagram",
              href: "https://instagram.com/aline.mvicente",
              bg: "linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)",
              icon: (
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="white" strokeWidth="1.8">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                  <circle cx="12" cy="12" r="4.3" />
                  <circle cx="17.4" cy="6.6" r="1.1" fill="white" stroke="none" />
                </svg>
              ),
            },
            {
              label: "Substack",
              href: "https://substack.com/@alinevicente",
              bg: "#FF6719",
              icon: (
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M3 3h18v3.6H3V3Zm0 5.6h18v3.6H3V8.6ZM3 14.2h18V21L12 16.4 3 21v-6.8Z" />
                </svg>
              ),
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="w-40 rounded-2xl border border-[var(--color-border)] py-8 flex flex-col items-center gap-3 hover:border-[var(--color-teal)] transition-colors"
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: item.bg }}
              >
                {item.icon}
              </span>
              <span className="font-display font-medium text-[var(--color-ink)]">
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-[var(--color-teal-dark)] text-white/80 text-center py-8 px-6 text-sm">
        © {new Date().getFullYear()} Aline Vicente Consultoria. Todos os direitos reservados.
      </footer>
    </main>
  );
}
