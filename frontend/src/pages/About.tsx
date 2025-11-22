import { Info, User, GraduationCap, Mail, Code, Package, Rocket, BookOpen, Heart, Award, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Info className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sobre o EduSolos</h1>
            <p className="text-sm md:text-base text-muted-foreground">Conheça o projeto e seu desenvolvedor</p>
          </div>
        </div>
      </div>

      {/* Sobre o Projeto */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Sobre o Projeto</h2>
        </div>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-foreground">EduSolos</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  O <strong className="text-foreground">EduSolos</strong> é uma plataforma educacional completa para análise e aprendizado em
                  <strong className="text-foreground"> Mecânica dos Solos</strong>. Desenvolvido com foco em educação e praticidade, oferece uma
                  suíte integrada de ferramentas profissionais para cálculos geotécnicos, com interface moderna e intuitiva adaptada para
                  estudantes, professores e profissionais de <strong className="text-foreground">Engenharia Civil</strong> e geotecnia.
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Com uma interface moderna e intuitiva, o EduSolos oferece módulos completos para análise de
                  <strong className="text-foreground"> índices físicos</strong>,
                  <strong className="text-foreground"> limites de consistência</strong>,
                  <strong className="text-foreground"> granulometria e classificação (USCS e HRB)</strong>,
                  <strong className="text-foreground"> compactação (Proctor)</strong>,
                  <strong className="text-foreground"> tensões geostáticas</strong>,
                  <strong className="text-foreground"> acréscimo de tensões (Boussinesq, Carothers, Love, Newmark)</strong> e
                  <strong className="text-foreground"> recalque por adensamento (Teoria de Terzaghi)</strong>.
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Todos os cálculos são realizados <strong className="text-foreground">100% offline</strong> no navegador, sem necessidade de
                  servidor externo ou conexão à internet. O sistema é baseado em normas técnicas (NBR, ASTM) e métodos consolidados da
                  engenharia geotécnica, garantindo precisão e confiabilidade nos resultados.
                </p>
              </div>
            </div>

            {/* Características */}
            <div className="pt-3 md:pt-4 border-t border-border/50">
              <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">Principais Características:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>100% offline - Funciona sem internet</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Cálculos geotécnicos automatizados e precisos</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Visualizações gráficas interativas</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Exportação profissional em PDF e Excel</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Sistema de salvamento e carregamento</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Tutoriais interativos em cada módulo</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Exemplos práticos pré-configurados</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Interface responsiva (desktop, tablet, mobile)</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Temas personalizáveis e modo claro/escuro</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                  <span>Baseado em normas técnicas (NBR, ASTM)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Sobre o Autor */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Sobre o Desenvolvedor</h2>
        </div>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="space-y-2 md:space-y-3 flex-1">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">Samuel Sousa Santos</h3>
                  <p className="text-sm md:text-base text-muted-foreground">Desenvolvedor & Estudante de Engenharia Civil</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1.5 text-xs md:text-sm">
                    <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    Engenharia Civil - UFCA
                  </Badge>
                </div>

                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Estudante de <strong className="text-foreground">Engenharia Civil</strong> na
                  <strong className="text-foreground"> Universidade Federal do Cariri (UFCA)</strong>. O EduSolos nasceu da vontade de unir conhecimentos
                  em programação com a área de geotecnia, criando uma ferramenta que pudesse beneficiar
                  outros estudantes e profissionais da área.
                </p>
              </div>
            </div>

            {/* Links de Contato */}
            <div className="pt-3 md:pt-4 border-t border-border/50">
              <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">Entre em Contato:</h4>
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
        </Card>
      </section>

      {/* Tecnologias */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Tecnologias Utilizadas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Frontend */}
          <Card className="glass p-4 md:p-5">
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-sm md:text-base font-medium text-foreground flex items-center gap-2">
                <Code className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                Frontend
              </h3>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Badge variant="outline" className="text-xs">React</Badge>
                <Badge variant="outline" className="text-xs">TypeScript</Badge>
                <Badge variant="outline" className="text-xs">Vite</Badge>
                <Badge variant="outline" className="text-xs">Tailwind CSS</Badge>
                <Badge variant="outline" className="text-xs">Shadcn/ui</Badge>
                <Badge variant="outline" className="text-xs">Recharts</Badge>
                <Badge variant="outline" className="text-xs">React Hook Form</Badge>
                <Badge variant="outline" className="text-xs">Zod</Badge>
              </div>
            </div>
          </Card>

          {/* Bibliotecas e Ferramentas */}
          <Card className="glass p-4 md:p-5">
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-sm md:text-base font-medium text-foreground flex items-center gap-2">
                <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                Bibliotecas e Ferramentas
              </h3>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Badge variant="outline" className="text-xs">React Hook Form</Badge>
                <Badge variant="outline" className="text-xs">Zod</Badge>
                <Badge variant="outline" className="text-xs">Recharts</Badge>
                <Badge variant="outline" className="text-xs">jsPDF</Badge>
                <Badge variant="outline" className="text-xs">xlsx</Badge>
                <Badge variant="outline" className="text-xs">Zustand</Badge>
                <Badge variant="outline" className="text-xs">date-fns</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong className="text-foreground">Backend Integrado:</strong> Todos os cálculos são realizados 100% no frontend usando TypeScript puro, sem necessidade de servidor externo.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Missão e Valores */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Missão e Valores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <Card className="glass p-4 md:p-5 border-l-4 border-l-primary">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-sm md:text-base font-semibold text-foreground">Nossa Missão</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Democratizar o acesso a ferramentas de qualidade para análise geotécnica, tornando o aprendizado da Mecânica dos Solos mais acessível e prático.
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass p-4 md:p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-sm md:text-base font-semibold text-foreground">Nossos Valores</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Qualidade, acessibilidade, educação e inovação. Desenvolvido com foco na experiência do usuário e precisão dos cálculos.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Licença e Agradecimentos */}
      <section className="space-y-3 md:space-y-4">
        <Card className="glass p-4 md:p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground">Agradecimentos</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Este projeto foi desenvolvido com muito carinho e dedicação para a comunidade acadêmica.
                Agradeço a todos os professores, colegas e profissionais que contribuíram com conhecimento
                e feedback para tornar o EduSolos uma ferramenta cada vez melhor.
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-sm md:text-base font-semibold text-foreground">Licença</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Este projeto é distribuído sob a licença <strong className="text-foreground">PolyForm Noncommercial 1.0.0</strong>.
              Você é livre para usar, modificar e distribuir conforme os termos da licença.
              Para mais informações, consulte o arquivo LICENSE no repositório.
            </p>
          </div>
        </Card>
      </section>

      {/* Versão */}
      <div className="text-center text-xs md:text-sm text-muted-foreground pb-4">
        <p>EduSolos v1.0.0 - Desenvolvido por Samuel Sousa Santos</p>
        <p className="text-xs mt-1">© 2025 - Todos os direitos reservados</p>
      </div>
    </div>
  );
}

