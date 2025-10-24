import { ArrowLeft, Target, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PrintHeader from "@/components/PrintHeader";

interface BoussinesqAnaliseProps {
  onVoltar: () => void;
}

export default function BoussinesqAnalise({ onVoltar }: BoussinesqAnaliseProps) {

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <PrintHeader moduleTitle="Boussinesq - Carga Pontual" moduleName="boussinesq" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onVoltar}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boussinesq - Carga Pontual</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Análise de acréscimo de tensões por carga pontual
          </p>
        </div>
      </div>

      {/* Card de Em Desenvolvimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Construction className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Módulo em Desenvolvimento</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Este módulo está sendo implementado
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Construction className="h-4 w-4 text-primary" />
            <AlertTitle>Funcionalidade em Construção</AlertTitle>
            <AlertDescription>
              O método de Boussinesq para análise de acréscimo de tensões devido a cargas pontuais
              está sendo desenvolvido. Em breve você poderá:
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-foreground">Recursos Planejados:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Análise visual 2D interativa com diagrama de solo</li>
              <li>Adição de múltiplos pontos de análise</li>
              <li>Cálculo de acréscimo de tensões verticais (Δσz)</li>
              <li>Visualização gráfica da distribuição de tensões</li>
              <li>Perfil de tensões em profundidade</li>
              <li>Tabela detalhada de resultados</li>
              <li>Exportação de relatórios em PDF e Excel</li>
            </ul>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-foreground mb-2">Sobre o Método:</h3>
              <p className="text-muted-foreground leading-relaxed">
                A solução de <strong>Boussinesq</strong> é uma das mais clássicas e fundamentais 
                da Mecânica dos Solos, utilizada para calcular o acréscimo de tensões verticais 
                em um ponto qualquer do maciço de solo devido a uma carga pontual vertical 
                aplicada na superfície. Esta solução assume que o solo se comporta como um meio 
                semi-infinito, elástico, homogêneo e isotrópico.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>Aplicações práticas:</strong> Fundações por estacas, cargas concentradas, 
                torres de transmissão, postes e outras estruturas que transmitem cargas pontuais 
                ao solo.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onVoltar}>
              Voltar para Seleção de Métodos
            </Button>
            <span className="text-xs text-muted-foreground">
              Status: 🚧 Em Desenvolvimento
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
