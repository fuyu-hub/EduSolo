import { Info, User, GraduationCap, Mail, BookOpen, Heart } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UI_STANDARDS } from "@/lib/ui-standards";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";

export default function About() {
  return (
    <div className={UI_STANDARDS.pageContainer}>
      <Helmet>
        <title>Sobre o Projeto | EduSolos</title>
        <meta name="description" content="Conheça o EduSolos, uma plataforma educacional para análise e aprendizado em Mecânica dos Solos desenvolvida por Samuel Sousa Santos." />
      </Helmet>
      
      <PrintHeader moduleTitle="Sobre" moduleName="about" />

      {/* Header */}
      <div className={UI_STANDARDS.header.container}>
        <div className="flex items-center gap-3">
          <div className={UI_STANDARDS.header.iconContainer}>
            <Info className={UI_STANDARDS.header.icon} />
          </div>
          <div>
            <h1 className={UI_STANDARDS.header.title}>Sobre o EduSolos</h1>
            <p className={UI_STANDARDS.header.subtitle}>Conheça o projeto e seu desenvolvedor</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 animate-in slide-in-from-left-5 duration-300">
        {/* Card: Sobre o Projeto */}
        <Card className="glass border-primary/20">
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-primary" />
              Sobre o Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <p className="text-sm text-foreground leading-relaxed text-justify">
              O <strong className="text-foreground">EduSolos</strong> é uma plataforma educacional completa para análise e aprendizado em <strong className="text-foreground">Mecânica dos Solos</strong>. Desenvolvido com foco em educação e praticidade, oferece uma suíte integrada de ferramentas interativas para cálculos geotécnicos, com interface moderna e intuitiva adaptada para estudantes, professores e profissionais de <strong className="text-foreground">Engenharia Civil</strong> e geotecnia.
            </p>
            <p className="text-sm text-foreground leading-relaxed text-justify">
              Com uma interface moderna, o <strong className="text-foreground">EduSolos</strong> oferece módulos completos para análise de <strong className="text-foreground">Índices Físicos e Limites de Consistência</strong>, <strong className="text-foreground">Classificação Granulométrica</strong> e <strong className="text-foreground">Compactação</strong>. O projeto está em contínua expansão, com atualizações futuras focadas em Tensões Geostáticas, Acréscimo de Tensões, Recalque por Adensamento e Resistência ao Cisalhamento.
            </p>
            <p className="text-sm text-foreground leading-relaxed text-justify">
              Para garantir agilidade, todo o processamento dos dados ocorre localmente no seu navegador, sem a necessidade de servidores externos. A ferramenta também se destaca por recursos didáticos práticos, como dados de exemplo pré-carregados e a geração nativa de gráficos exportáveis. Tudo isso fundamentado rigorosamente nas normas técnicas da <strong className="text-foreground">ABNT</strong> e nas bibliografias da geotecnia, garantindo a precisão e a confiabilidade dos resultados.
            </p>
          </CardContent>
        </Card>

        {/* Card: Sobre o Desenvolvedor */}
        <Card className="glass border-blue-500/20">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-blue-500" />
              Sobre o Desenvolvedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 flex items-center justify-center flex-shrink-0 border-2 border-blue-500/20">
                <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
              </div>
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Samuel Sousa Santos</h3>
                  <p className="text-sm text-foreground">Desenvolvedor &amp; Estudante de Engenharia Civil</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
                    <GraduationCap className="w-3 h-3" />
                    Engenharia Civil - UFCA
                  </Badge>
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  Estudante de <strong className="text-foreground">Engenharia Civil</strong> na
                  <strong className="text-foreground"> Universidade Federal do Cariri (UFCA)</strong>. O EduSolos nasceu da vontade de unir conhecimentos
                  em programação com a área de geotecnia, criando uma ferramenta que pudesse beneficiar
                  outros estudantes e profissionais da área.
                </p>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Entre em Contato:</h4>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="mailto:contactsamsantos@gmail.com">
                  <Mail className="w-4 h-4" />
                  E-mail
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Agradecimentos */}
        <Card className="glass border-emerald-500/20">
          <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-5 h-5 text-emerald-500" />
              Agradecimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-sm text-foreground leading-relaxed">
              Este projeto foi desenvolvido com muito carinho e dedicação para a comunidade acadêmica.
              Agradeço a todos os professores, colegas e profissionais que contribuíram com conhecimento
              e feedback para tornar o EduSolos uma ferramenta cada vez melhor.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Versão */}
      <div className="text-center text-xs md:text-sm text-muted-foreground pb-4">
        <p>EduSolos v1.1.0 - Desenvolvido por Samuel Sousa Santos</p>
        <p className="text-xs mt-1">© 2026 - Todos os direitos reservados</p>
      </div>
    </div>
  );
}
