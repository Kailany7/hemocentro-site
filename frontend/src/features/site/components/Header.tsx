import { Link } from "@tanstack/react-router";
import { ArrowRight, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#campanhas", label: "Campanhas" },
  { href: "#locais", label: "Locais" },
  { href: "#criterios", label: "Critérios" },
  { href: "#estoque", label: "Estoque" },
  { href: "#sobre", label: "Sobre" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-5 lg:px-8">
        <a
          href="#inicio"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-foreground sm:gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-brand">
            <Droplets />
          </span>
          <span className="text-lg sm:text-xl">
            Hemo<span className="text-primary">Help</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <Button
          asChild
          className="shrink-0 rounded-full px-3 text-xs shadow-brand sm:px-5 sm:text-sm"
        >
          <Link to="/doador">
            Área do doador <ArrowRight className="hidden sm:block" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
