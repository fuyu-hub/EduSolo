import { Info, User, GraduationCap, Github, Mail, Code, Package, Rocket, BookOpen, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sobre o EduSolo</h1>
            <p className="text-muted-foreground">Conheça o projeto e seu desenvolvedor</p>
          </div>
        </div>
      </div>

      {/* Sobre o Projeto */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Sobre o Projeto</h2>
        </div>

        <Card className="glass p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-semibold text-foreground">EduSolo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  O <strong className="text-foreground">EduSolo</strong> é uma ferramenta educacional desenvolvida para auxiliar 
                  estudantes e profissionais de <strong className="text-foreground">Engenharia Civil</strong> na realização 
                  de cálculos geotécnicos. O projeto foi criado com o objetivo de tornar o aprendizado e a prática da 
                  <strong className="text-foreground"> Mecânica dos Solos</strong> mais acessível e interativa.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Com uma interface moderna e intuitiva, o EduSolo oferece módulos completos para análise de 
                  <strong className="text-foreground"> índices físicos</strong>, 
                  <strong className="text-foreground"> limites de consistência</strong>, 
                  <strong className="text-foreground"> granulometria</strong>, 
                  <strong className="text-foreground"> compactação</strong>, 
                  <strong className="text-foreground"> tensões geostáticas</strong> e 
                  <strong className="text-foreground"> acréscimo de tensões</strong>.
                </p>
              </div>
            </div>

            {/* Características */}
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-3">Principais Características:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Cálculos geotécnicos automatizados</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Visualizações gráficas interativas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Exportação em PDF e Excel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Material educacional integrado</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Interface moderna e responsiva</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Salvamento local de cálculos</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Sobre o Autor */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Sobre o Desenvolvedor</h2>
        </div>

        <Card className="glass p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Samuel Sousa Santos</h3>
                  <p className="text-muted-foreground">Desenvolvedor & Estudante de Engenharia Civil</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Engenharia Civil - UFCA
                  </Badge>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  Estudante de <strong className="text-foreground">Engenharia Civil</strong> na 
                  <strong className="text-foreground"> Universidade Federal do Cariri (UFCA)</strong>, 
                  apaixonado por tecnologia e educação. O EduSolo nasceu da vontade de unir conhecimentos 
                  em programação com a área de geotecnia, criando uma ferramenta que pudesse beneficiar 
                  outros estudantes e profissionais da área.
                </p>
              </div>
            </div>

            {/* Links de Contato */}
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-3">Entre em Contato:</h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href="https://github.com/fuyu-hub" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href="mailto:contactsamsantos@gmail.com">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Tecnologias */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Tecnologias Utilizadas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend */}
          <Card className="glass p-5">
            <div className="space-y-3">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                Frontend
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">React</Badge>
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">Vite</Badge>
                <Badge variant="outline">Tailwind CSS</Badge>
                <Badge variant="outline">Shadcn/ui</Badge>
                <Badge variant="outline">Recharts</Badge>
                <Badge variant="outline">React Hook Form</Badge>
                <Badge variant="outline">Zod</Badge>
              </div>
            </div>
          </Card>

          {/* Backend */}
          <Card className="glass p-5">
            <div className="space-y-3">
              <h3 className="text-base font-medium text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Backend
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Python</Badge>
                <Badge variant="outline">FastAPI</Badge>
                <Badge variant="outline">Pydantic</Badge>
                <Badge variant="outline">NumPy</Badge>
                <Badge variant="outline">SciPy</Badge>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Licença e Agradecimentos */}
      <section className="space-y-4">
        <Card className="glass p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Agradecimentos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este projeto foi desenvolvido com muito carinho e dedicação para a comunidade acadêmica. 
                Agradeço a todos os professores, colegas e profissionais que contribuíram com conhecimento 
                e feedback para tornar o EduSolo uma ferramenta cada vez melhor.
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass p-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">Licença</h3>
            <p className="text-sm text-muted-foreground">
              Este projeto é distribuído sob a licença MIT. Você é livre para usar, modificar e distribuir 
              conforme os termos da licença.
            </p>
          </div>
        </Card>
      </section>

      {/* Versão */}
      <div className="text-center text-sm text-muted-foreground pb-4">
        <p>EduSolo v1.0.0 - Desenvolvido por Samuel Sousa Santos</p>
        <p className="text-xs mt-1">© 2025 - Todos os direitos reservados</p>
      </div>
    </div>
  );
}

