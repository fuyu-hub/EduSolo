/**
 * 🎨 GUIA DE INTEGRAÇÃO UI/UX - EduSolo
 * 
 * Este arquivo contém exemplos práticos de como usar os novos componentes
 * e funcionalidades de UI/UX implementados.
 */

// ============================================
// 1. InputEnhanced - Inputs com Super Poderes
// ============================================
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { Calculator } from "lucide-react";

function ExemploInputEnhanced() {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      {/* Input Básico com Tooltip */}
      <InputEnhanced
        label="Massa Úmida (g)"
        tooltip="Massa total da amostra incluindo água"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex: 150.5"
      />

      {/* Input com Estado de Sucesso */}
      <InputEnhanced
        label="Massa Seca (g)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        success={!!value && !isNaN(parseFloat(value))}
        helperText="Valor válido detectado"
      />

      {/* Input com Erro */}
      <InputEnhanced
        label="Volume (cm³)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
      />

      {/* Input com Loading e Prefix */}
      <InputEnhanced
        label="Densidade"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        isLoading={isLoading}
        prefix={<Calculator className="w-4 h-4" />}
        suffix="kg/m³"
      />
    </>
  );
}

// ============================================
// 2. SuccessAnimation - Celebração de Sucesso
// ============================================
import { SuccessAnimation } from "@/components/ui/success-animation";

function ExemploSuccessAnimation() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCalculate = async () => {
    // ... sua lógica de cálculo
    const result = await calcularAlgo();
    
    if (result.success) {
      setShowSuccess(true);
    }
  };

  return (
    <>
      <button onClick={handleCalculate}>Calcular</button>

      {showSuccess && (
        <SuccessAnimation
          title="Cálculo Completo!"
          message="Todos os dados foram processados com sucesso."
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}

// ============================================
// 3. FormProgress - Indicador de Progresso
// ============================================
import { FormProgress } from "@/components/ui/form-progress";

function ExemploFormProgress() {
  const [formData, setFormData] = useState({
    campo1: "",
    campo2: "",
    campo3: "",
  });

  const formProgressFields = [
    { 
      name: 'campo1', 
      label: 'Campo 1', 
      filled: !!formData.campo1 
    },
    { 
      name: 'campo2', 
      label: 'Campo 2', 
      filled: !!formData.campo2 
    },
    { 
      name: 'campo3', 
      label: 'Campo 3', 
      filled: !!formData.campo3 
    },
  ];

  return (
    <div>
      <FormProgress 
        fields={formProgressFields} 
        className="mb-6" 
      />
      
      {/* Seus inputs aqui */}
    </div>
  );
}

// ============================================
// 4. useSwipe Hook - Gestos Touch Mobile
// ============================================
import { useSwipe } from "@/hooks/use-swipe";

function ExemploSwipe() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => {
      setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    },
    onSwipeRight: () => {
      setCurrentSlide(prev => Math.max(prev - 1, 0));
    },
    threshold: 50,
  });

  return (
    <div ref={swipeRef} className="touch-pan-y">
      <div>Slide {currentSlide + 1}</div>
      {/* Seu conteúdo aqui */}
    </div>
  );
}

// ============================================
// 5. QuickActionFAB - Botão de Ação Flutuante
// ============================================
import { QuickActionFAB } from "@/components/ui/quick-action-fab";
import { Save, Download, Share2 } from "lucide-react";

function ExemploFAB() {
  return (
    <QuickActionFAB
      actions={[
        {
          icon: <Save className="w-5 h-5" />,
          label: "Salvar",
          onClick: () => console.log("Salvar"),
          color: "bg-green-500 hover:bg-green-600",
        },
        {
          icon: <Download className="w-5 h-5" />,
          label: "Exportar PDF",
          onClick: () => console.log("Exportar"),
          color: "bg-red-500 hover:bg-red-600",
        },
        {
          icon: <Share2 className="w-5 h-5" />,
          label: "Compartilhar",
          onClick: () => console.log("Compartilhar"),
          color: "bg-blue-500 hover:bg-blue-600",
        },
      ]}
    />
  );
}

// ============================================
// 6. DialogEnhanced - Modais Melhorados
// ============================================
import {
  DialogEnhanced,
  DialogEnhancedContent,
  DialogEnhancedHeader,
  DialogEnhancedTitle,
  DialogEnhancedDescription,
  DialogEnhancedFooter,
  DialogEnhancedTrigger,
} from "@/components/ui/dialog-enhanced";
import { Button } from "@/components/ui/button";

function ExemploDialogEnhanced() {
  return (
    <DialogEnhanced>
      <DialogEnhancedTrigger asChild>
        <Button>Abrir Modal</Button>
      </DialogEnhancedTrigger>
      <DialogEnhancedContent>
        <DialogEnhancedHeader>
          <DialogEnhancedTitle>Título do Modal</DialogEnhancedTitle>
          <DialogEnhancedDescription>
            Descrição do modal com animações suaves
          </DialogEnhancedDescription>
        </DialogEnhancedHeader>
        
        {/* Conteúdo */}
        <div className="py-4">
          Seu conteúdo aqui
        </div>

        <DialogEnhancedFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Confirmar</Button>
        </DialogEnhancedFooter>
      </DialogEnhancedContent>
    </DialogEnhanced>
  );
}

// ============================================
// 7. Shake Animation em Erros
// ============================================
import { cn } from "@/lib/utils";

function ExemploShakeAnimation() {
  const [errorShake, setErrorShake] = useState(false);

  const handleSubmit = () => {
    if (hasError) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    }
  };

  return (
    <Card className={cn(
      "p-6",
      errorShake && "animate-shake"
    )}>
      {/* Seu conteúdo */}
    </Card>
  );
}

// ============================================
// 8. EXEMPLO COMPLETO - Página de Cálculo
// ============================================
function PaginaCalculoCompleta() {
  const [formData, setFormData] = useState({ /* ... */ });
  const [results, setResults] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const formProgressFields = [
    { name: 'campo1', label: 'Campo 1', filled: !!formData.campo1 },
    // ... outros campos
  ];

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await calcular(formData);
      setResults(result);
      setShowSuccess(true);
    } catch (error) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      {showSuccess && (
        <SuccessAnimation
          title="Cálculo Concluído!"
          message="Resultados prontos para visualização"
          onComplete={() => setShowSuccess(false)}
        />
      )}

      {/* Quick Action FAB */}
      <QuickActionFAB
        actions={[
          {
            icon: <Save className="w-5 h-5" />,
            label: "Salvar",
            onClick: handleSave,
            color: "bg-green-500",
          },
          {
            icon: <Download className="w-5 h-5" />,
            label: "Exportar",
            onClick: handleExport,
            color: "bg-red-500",
          },
        ].filter(action => !!results)} // Só mostra se houver resultados
      />

      {/* Formulário com Shake */}
      <Card className={cn(
        "p-6",
        errorShake && "animate-shake"
      )}>
        {/* Form Progress */}
        <FormProgress fields={formProgressFields} className="mb-6" />

        {/* Inputs Enhanced */}
        <div className="space-y-4">
          <InputEnhanced
            label="Campo 1"
            value={formData.campo1}
            onChange={(e) => setFormData({...formData, campo1: e.target.value})}
            tooltip="Descrição do campo"
            success={!!formData.campo1}
          />
          {/* Mais inputs... */}
        </div>

        {/* Botão de Calcular */}
        <Button 
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full mt-6"
        >
          {isCalculating ? "Calculando..." : "Calcular"}
        </Button>
      </Card>

      {/* Resultados com Swipe */}
      {results && <ResultadosComSwipe results={results} />}
    </div>
  );
}

// ============================================
// 9. CLASSES CSS DISPONÍVEIS
// ============================================

/**
 * Animações CSS disponíveis:
 * 
 * - .animate-shimmer     - Efeito shimmer para skeleton loaders
 * - .animate-float       - Efeito flutuante (sobe e desce)
 * - .animate-bounce-subtle - Bounce suave
 * - .animate-confetti    - Partículas de confetti
 * - .animate-ripple      - Efeito de ondulação
 * - .animate-shake       - Efeito de tremor (erro)
 * 
 * Exemplos de uso:
 */

function ExemplosAnimacoes() {
  return (
    <>
      {/* Skeleton com Shimmer */}
      <div className="h-10 w-full bg-muted animate-shimmer rounded" />

      {/* Ícone Flutuante */}
      <div className="animate-float">
        <Calculator className="w-8 h-8" />
      </div>

      {/* Badge com Bounce */}
      <span className="animate-bounce-subtle">Novo!</span>

      {/* Card com Shake ao erro */}
      <div className={errorState ? "animate-shake" : ""}>
        Card com erro
      </div>
    </>
  );
}

export {};

