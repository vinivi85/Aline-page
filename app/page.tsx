import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Nav simples */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="font-display font-semibold text-lg text-[var(--color-teal-dark)]">
          Aline Vicente
        </span>
        <Link
          href="/agendar"
          className="rounded-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white text-sm font-semibold px-5 py-2.5"
        >
          Agendar sessão
        </Link>
      </header>

      {/* Sobre a Aline — logo no início, identidade em destaque */}
      <section className="border-t-4 border-[var(--color-teal)] pt-14 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--color-ink)] mb-2">
            Conheça a <span className="text-[var(--color-blue-accent)]">Aline Vicente</span>
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

          <div className="text-left sm:text-center text-[var(--color-ink-soft)] leading-relaxed flex flex-col gap-5 text-[15px] sm:text-base">
            <p>
              Há nove anos, o autismo faz parte da minha rotina — não apenas nos livros ou nas
              formações, mas dentro da minha própria casa. Sou mãe de uma menina autista e de uma
              filha típica, o que me deu uma visão completa sobre desenvolvimento, comportamento,
              irmãos e família.
            </p>
            <p>
              Ao longo desses anos, mergulhei nos estudos sobre o autismo, aprendi os princípios
              da Análise do Comportamento Aplicada (ABA) e, hoje, atuo também no campo prático,
              como terapeuta (RBT), acompanhando crianças e famílias diariamente.
            </p>
            <p>
              Minha missão é unir o que aprendi como mãe, como profissional e como educadora para
              traduzir o autismo de forma clara, real e aplicável — sem promessas mágicas, mas com
              estratégias que funcionam e respeito ao tempo de cada criança.
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
          <Link
            href="/agendar"
            className="inline-block rounded-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white font-semibold px-8 py-3.5"
          >
            Ver horários disponíveis →
          </Link>
        </div>
      </section>

      {/* Conecte-se comigo */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)] mb-10">
          Conecte-se Comigo
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { label: "YouTube", href: "#" },
            { label: "Instagram", href: "#" },
            { label: "Substack", href: "#" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="w-40 rounded-2xl border border-[var(--color-border)] py-8 flex flex-col items-center gap-3 hover:border-[var(--color-teal)] transition-colors"
            >
              <span className="w-14 h-14 rounded-full bg-[var(--color-teal-light)] flex items-center justify-center text-[var(--color-teal)] font-display font-semibold">
                {item.label[0]}
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
        © {new Date().getFullYear()} Aline Vicente. Todos os direitos reservados.
      </footer>
    </main>
  );
}
