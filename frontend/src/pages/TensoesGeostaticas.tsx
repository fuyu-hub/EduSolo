// frontend/src/pages/TensoesGeostaticas.tsx
import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { calcularTensoesGeostaticas } from "@/modules/tensoes/calculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mountain, Info, Calculator as CalcIcon, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle, BarChart3, Save, FolderOpen, Download, Printer, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedCalculations } from "@/hooks/use-saved-calculations";
import { useSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import SavedCalculations from "@/componentes/compartilhados/CalculosSalvos";
import SaveDialog from "@/componentes/dialogos/DialogoSalvar";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";
import CalculationActions from "@/componentes/compartilhados/BarraAcoes";
import { exportToPDF, exportToExcel, ExportData, ExcelExportData, formatNumberForExport, captureChartAsImage, generateDefaultPDFFileName } from "@/lib/utils/export-utils";
import ExportPDFDialog from "@/componentes/dialogos/DialogoExportarPDF";
import PerfilTensoes from "@/modules/tensoes/components/PerfilTensoes";
import TabelaResultados from "@/modules/tensoes/components/TabelaResultados";
import DiagramaCamadas from "@/modules/tensoes/components/DiagramaCamadas";
import DialogExemplos from "@/modules/tensoes/components/DialogExemplos";
import { ExemploTensoes } from "@/modules/tensoes/exemplos-tensoes";
import { CamadaData } from "@/modules/tensoes/components/DialogCamada";
import DialogConfiguracoes, { ConfigData } from "@/modules/tensoes/components/DialogConfiguracoes";
import { transferirNAParaCamadaCorreta, CamadaTensoes } from "@/lib/utils/tensoes-utils";


// Schema de validação
const camadaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, { message: "Nome da camada é obrigatório" }),
  espessura: z.string().min(1, { message: "Campo obrigatório" }).refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Espessura deve ser maior que 0" }),
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Profundidade deve ser maior ou igual a 0 (ou deixe vazio)",
  }),
  capilaridade: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Altura deve ser maior ou igual a 0 (ou deixe vazio)",
  }),
  gamaNat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "γ natural deve ser maior que 0 (ou deixe vazio)",
  }),
  gamaSat: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
    message: "γ saturado deve ser maior que 0 (ou deixe vazio)",
  }),
  Ko: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1), {
    message: "Ko deve estar entre 0 e 1 (ou deixe vazio)"
  }),
  impermeavel: z.boolean().optional(),
});

const formSchema = z.object({
  profundidadeNA: z.string().optional().refine(val => val === undefined || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), { message: "Profundidade deve ser maior ou igual a 0 (ou deixe vazio)" }),
  alturaCapilar: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Altura deve ser maior ou igual a 0" }),
  pesoEspecificoAgua: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Peso específico da água deve ser maior que 0" }),
  camadas: z.array(camadaSchema).min(1, { message: "É necessária pelo menos 1 camada de solo" }),
});

type FormInputValues = z.infer<typeof formSchema>;

// Interfaces para API
interface CamadaSoloAPI {
  espessura: number;
  gama_nat?: number | null;
  gama_sat?: number | null;
  Ko?: number;
  impermeavel?: boolean;
  profundidade_na_camada?: number | null;
  altura_capilar_camada?: number | null;
}

interface TensoesGeostaticasInputAPI {
  camadas: CamadaSoloAPI[];
  profundidade_na: number;
  altura_capilar: number;
  peso_especifico_agua: number;
}

import { TensoesGeostaticasOutput } from "@/modules/tensoes/schemas";


const tooltips = {
  profundidadeNA: "Profundidade do Nível d'Água (NA) a partir da superfície (m)",
  alturaCapilar: "Altura da franja capilar acima do NA (m)",
  espessura: "Espessura da camada de solo (m)",
  gamaNat: "Peso específico natural do solo (kN/m³) - usado acima do NA",
  gamaSat: "Peso específico saturado do solo (kN/m³) - usado abaixo do NA",
  Ko: "Coeficiente de empuxo em repouso (adimensional, típico: 0.4-0.6). Opcional: deixe vazio se não desejar calcular tensões horizontais",
};

// Cálculos agora são feitos localmente no frontend

// Função para gerar IDs únicos (alternativa ao crypto.randomUUID para compatibilidade)
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

function TensoesGeostaticasDesktop() {
  const { toast: toastFn } = { toast };
  const { settings } = useSettings();
  const { theme } = useTheme();
  const [currentCamadaIndex, setCurrentCamadaIndex] = useState(0);
  const [config, setConfig] = useState<ConfigData>({
    pesoEspecificoAgua: "10.0",
  });

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profundidadeNA: "",
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        { id: generateId(), nome: "Camada 1", espessura: "5.0", profundidadeNA: "", capilaridade: "", gamaNat: "18.0", gamaSat: "20.0", Ko: "", impermeavel: false },
      ],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "camadas", keyName: "fieldId" });

  const [results, setResults] = useState<TensoesGeostaticasOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para salvamento
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, renameCalculation } = useSavedCalculations("tensoes-geostaticas");

  // Estados para exportação PDF
  const [exportPDFDialogOpen, setExportPDFDialogOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Definição dos steps do tour


  useEffect(() => {
    if (fields.length > 0) {
      setCurrentCamadaIndex(prev => Math.min(prev, fields.length - 1));
    } else {
      setCurrentCamadaIndex(0);
    }
  }, [fields.length]);

  const addCamada = () => {
    append({ id: generateId(), nome: `Camada ${fields.length + 1}`, espessura: "", profundidadeNA: "", capilaridade: "", gamaNat: "", gamaSat: "", Ko: "", impermeavel: false });
    setCurrentCamadaIndex(fields.length);
  };

  // Handlers para o diagrama interativo
  const handleAddCamadaFromDiagram = (data: CamadaData) => {
    const novaCamada = {
      id: generateId(),
      nome: data.nome,
      espessura: data.espessura,
      profundidadeNA: data.profundidadeNA,
      capilaridade: data.capilaridade,
      gamaNat: data.gamaNat,
      gamaSat: data.gamaSat,
      Ko: data.Ko || "",
      impermeavel: data.impermeavel || false
    };

    append(novaCamada);

    // Se foi definido um NA, transferir para a camada correta
    if (data.profundidadeNA && data.profundidadeNA !== "") {
      const profNA = parseFloat(data.profundidadeNA);
      const cap = parseFloat(data.capilaridade || "0");

      if (!isNaN(profNA)) {
        setTimeout(() => {
          const camadasAtuais = form.getValues("camadas") as CamadaTensoes[];
          const resultado = transferirNAParaCamadaCorreta(profNA, cap, camadasAtuais.length - 1, camadasAtuais);

          if (resultado.erro) {
            toast("Aviso", { description: resultado.erro });
          } else {
            form.setValue("camadas", resultado.camadas);
            if (resultado.indexDestino !== camadasAtuais.length - 1) {
              toast("NA transferido", {
                description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)`
              });
            }
          }
        }, 100);
      }
    }

    toast("Nova camada adicionada!", { description: "Camada inserida com sucesso no perfil." });
  };

  const handleEditCamadaFromDiagram = (index: number, data: CamadaData) => {
    // Atualiza os dados básicos da camada
    form.setValue(`camadas.${index}.nome`, data.nome);
    form.setValue(`camadas.${index}.espessura`, data.espessura);
    form.setValue(`camadas.${index}.gamaNat`, data.gamaNat);
    form.setValue(`camadas.${index}.gamaSat`, data.gamaSat);
    form.setValue(`camadas.${index}.Ko`, data.Ko || "");
    form.setValue(`camadas.${index}.impermeavel`, data.impermeavel || false);

    // Se foi definido um NA, transferir para a camada correta
    const profNAStr = data.profundidadeNA;
    const capilaridadeStr = data.capilaridade;

    if (profNAStr && profNAStr !== "") {
      const profNA = parseFloat(profNAStr);
      const cap = parseFloat(capilaridadeStr || "0");

      if (!isNaN(profNA)) {
        const camadasAtuais = form.getValues("camadas") as CamadaTensoes[];
        const resultado = transferirNAParaCamadaCorreta(profNA, cap, index, camadasAtuais);

        if (resultado.erro) {
          toast("Erro", { description: resultado.erro });
          // Limpa o NA da camada atual se houver erro
          form.setValue(`camadas.${index}.profundidadeNA`, "");
          form.setValue(`camadas.${index}.capilaridade`, "");
        } else {
          form.setValue("camadas", resultado.camadas);
          if (resultado.indexDestino !== index) {
            toast("NA transferido", {
              description: `O NA foi movido para a Camada ${resultado.indexDestino + 1} (profundidade correta)`
            });
          }
        }
      }
    } else {
      // Limpa NA e capilaridade se não foram fornecidos
      form.setValue(`camadas.${index}.profundidadeNA`, "");
      form.setValue(`camadas.${index}.capilaridade`, "");
    }

    toast("Camada atualizada!", { description: `${data.nome} foi atualizada.` });
  };

  const handleConfigChange = (data: ConfigData) => {
    setConfig(data);
    toast("Configurações atualizadas!", { description: "Parâmetros globais aplicados." });
  };

  const removeCamada = () => {
    if (fields.length > 1) {
      remove(currentCamadaIndex);
    } else {
      toast("É necessária pelo menos 1 camada", { description: "Não é possível remover a última camada" });
    }
  };

  const goToNextCamada = () => setCurrentCamadaIndex(prev => Math.min(prev + 1, fields.length - 1));
  const goToPreviousCamada = () => setCurrentCamadaIndex(prev => Math.max(prev - 1, 0));

  const handleClear = () => {
    form.reset({
      profundidadeNA: "",
      alturaCapilar: "0.0",
      pesoEspecificoAgua: "10.0",
      camadas: [
        { id: generateId(), nome: "Camada 1", espessura: "5.0", profundidadeNA: "", capilaridade: "", gamaNat: "18.0", gamaSat: "20.0", Ko: "", impermeavel: false },
      ],
    });
    setCurrentCamadaIndex(0);
    setResults(null);
    setApiError(null);
  };

  const handleSelectExample = (example: ExemploTensoes) => {
    const currentLength = fields.length;
    const targetLength = example.camadas.length;

    // Atualiza as configurações globais
    setConfig({
      pesoEspecificoAgua: example.pesoEspecificoAgua,
    });

    if (currentLength < targetLength) {
      for (let i = 0; i < targetLength - currentLength; i++) {
        append({ id: generateId(), nome: "", espessura: "", profundidadeNA: "", capilaridade: "", gamaNat: "", gamaSat: "", Ko: "" }, { shouldFocus: false });
      }
    } else if (currentLength > targetLength) {
      for (let i = currentLength - 1; i >= targetLength; i--) {
        remove(i);
      }
    }

    setTimeout(() => {
      form.reset({
        profundidadeNA: example.profundidadeNA,
        alturaCapilar: example.alturaCapilar,
        pesoEspecificoAgua: example.pesoEspecificoAgua,
        camadas: example.camadas.map(c => ({ ...c, id: generateId() })),
      });
      setCurrentCamadaIndex(0);
      setResults(null);
      setApiError(null);
      toast(`${example.icon} ${example.nome} carregado!`, { description: example.descricao });
    }, 0);
  };

  const handleSaveClick = () => {
    if (!results) return;
    setSaveName(`Perfil ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!results || !saveName.trim()) return;
    const formData = form.getValues();
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast("Perfil salvo!", { description: "O perfil geotécnico foi salvo com sucesso." });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast("Erro ao salvar", { description: "Não foi possível salvar o perfil." });
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    const data = calculation.formData;
    form.reset(data);
    setResults(calculation.results);
    setCurrentCamadaIndex(0);
    toast("Perfil carregado!", { description: `"${calculation.name}" foi carregado com sucesso.` });
  };



  const handleExportPDF = () => {
    if (!results) return;

    // Gerar nome padrão usando a função auxiliar
    const defaultName = generateDefaultPDFFileName("Tensões Geostáticas");

    setPdfFileName(defaultName);
    setExportPDFDialogOpen(true);
  };

  const handleConfirmExportPDF = async () => {
    if (!results) return;
    const formData = form.getValues();

    setIsExportingPDF(true);

    toast("Capturando gráficos...");
    const perfilImage = await captureChartAsImage('perfil-tensoes-chart');
    const diagramaImage = await captureChartAsImage('diagrama-camadas-chart');

    // Dados de entrada vazios (serão tabelas)
    const inputs: { label: string; value: string }[] = [];

    const profundidadeMax = results.pontos_calculo[results.pontos_calculo.length - 1]?.profundidade || 0;
    const tensaoMaxV = Math.max(...results.pontos_calculo.map(p => p.tensao_total_vertical || 0));

    const resultsList: { label: string; value: string; highlight?: boolean }[] = [
      { label: "Profundidade Máxima", value: `${formatNumberForExport(profundidadeMax, 2)} m` },
      { label: "Tensão Total Vertical Máxima", value: `${formatNumberForExport(tensaoMaxV, 2)} kPa`, highlight: true },
    ];

    // Tabelas
    const tables = [];

    // TABELA 1: Configurações Gerais
    const configHeaders = ["Parâmetro", "Valor"];
    const configRows = [
      ["Profundidade do NA", `${formData.profundidadeNA} m`],
      ["Altura Franja Capilar", `${formData.alturaCapilar} m`],
    ];
    tables.push({
      title: "Configurações Gerais",
      headers: configHeaders,
      rows: configRows
    });

    // TABELA 2: Camadas
    const camadasHeaders = ["Camada", "Espessura (m)", "Peso Esp. Nat. (kN/m³)", "Peso Esp. Sat. (kN/m³)", "Ko"];
    const camadasRows = formData.camadas.map((c, i) => [
      c.nome || `Camada ${i + 1}`,
      c.espessura,
      c.gamaNat || "-",
      c.gamaSat || "-",
      c.Ko
    ]);
    tables.push({
      title: "Camadas do Perfil",
      headers: camadasHeaders,
      rows: camadasRows
    });

    // TABELA 3: Tensões nos Pontos de Cálculo
    // Verifica se há tensão horizontal nos resultados
    const temTensaoHorizontal = results.pontos_calculo.some(p => p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined);

    const tensoesHeaders = ["Prof. (m)", "Tensao Total (kPa)", "Pressao Neutra (kPa)", "Tensao Efet. V (kPa)"];
    if (temTensaoHorizontal) {
      tensoesHeaders.push("Tensao Efet. H (kPa)");
    }

    const tensoesRows = results.pontos_calculo.map(p => {
      const row = [
        formatNumberForExport(p.profundidade, 2),
        p.tensao_total_vertical !== null ? formatNumberForExport(p.tensao_total_vertical, 2) : "-",
        p.pressao_neutra !== null ? formatNumberForExport(p.pressao_neutra, 2) : "-",
        p.tensao_efetiva_vertical !== null ? formatNumberForExport(p.tensao_efetiva_vertical, 2) : "-",
      ];
      if (temTensaoHorizontal) {
        row.push(p.tensao_efetiva_horizontal !== null ? formatNumberForExport(p.tensao_efetiva_horizontal, 2) : "-");
      }
      return row;
    });

    tables.push({
      title: "Tensões nos Pontos de Cálculo",
      headers: tensoesHeaders,
      rows: tensoesRows
    });

    // Fórmulas utilizadas
    const formulas = [
      {
        label: "Tensão Total Vertical (σv)",
        formula: "σv = Σ(γi × hi)",
        description: "Soma dos produtos do peso específico pela espessura de cada camada acima do ponto"
      },
      {
        label: "Pressão Neutra (u)",
        formula: "u = γw × hw",
        description: "Onde hw é a altura da coluna d'água acima do ponto (hw = 0 acima do NA). γw = 10 kN/m³"
      },
      {
        label: "Tensão Efetiva Vertical (σ'v)",
        formula: "σ'v = σv - u",
        description: "Princípio das tensões efetivas de Terzaghi. Representa a tensão transmitida pelo esqueleto sólido"
      },
    ];

    if (temTensaoHorizontal) {
      formulas.push({
        label: "Tensão Efetiva Horizontal (σ'h)",
        formula: "σ'h = Ko × σ'v",
        description: "Onde Ko é o coeficiente de empuxo em repouso. Para solos normalmente adensados: Ko ≈ 1 - sen(φ')"
      });
    }

    formulas.push({
      label: "Franja Capilar",
      formula: "Na franja capilar: σv calculada com γsat, mas u = 0 (pressão negativa)",
      description: "A franja capilar eleva a água por capilaridade acima do NA, saturando o solo mas mantendo u ≤ 0"
    });

    const exportData: ExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      inputs,
      results: resultsList,
      formulas,
      tables,
      chartImage: perfilImage || diagramaImage || undefined,
      customFileName: pdfFileName,
      theme: { mode: theme.mode, color: (theme as any).color || 'indigo' },
      printSettings: settings.printSettings
    };

    toast("Gerando PDF...");
    const success = await exportToPDF(exportData);

    setIsExportingPDF(false);

    if (success) {
      toast("PDF exportado!", { description: "O arquivo foi baixado com sucesso." });
      setExportPDFDialogOpen(false);
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o PDF." });
    }
  };

  const handleExportExcel = async () => {
    if (!results) return;
    const formData = form.getValues();

    const configData: { label: string; value: string | number }[] = [
      { label: "Profundidade do NA (m)", value: formData.profundidadeNA },
      { label: "Altura Franja Capilar (m)", value: formData.alturaCapilar },
      { label: "Peso Específico da Água (kN/m³)", value: formData.pesoEspecificoAgua },
    ];

    const camadasData: { label: string; value: string | number }[] = [];
    formData.camadas.forEach((c, i) => {
      camadasData.push({ label: `Camada ${i + 1} - Espessura (m)`, value: c.espessura });
      if (c.gamaNat) camadasData.push({ label: `Camada ${i + 1} - Peso Específico Natural (kN/m³)`, value: c.gamaNat });
      if (c.gamaSat) camadasData.push({ label: `Camada ${i + 1} - Peso Específico Saturado (kN/m³)`, value: c.gamaSat });
      if (c.Ko && c.Ko !== "") camadasData.push({ label: `Camada ${i + 1} - Ko`, value: c.Ko });
    });

    const resultadosData: { label: string; value: string | number }[] = [];
    const temTensaoHorizontalExcel = results.pontos_calculo.some(p => p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined);

    results.pontos_calculo.forEach((p, i) => {
      resultadosData.push({ label: `Ponto ${i + 1} - Prof (m)`, value: p.profundidade.toFixed(2) });
      if (p.tensao_total_vertical !== null && p.tensao_total_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - Tensão Total Vertical (kPa)`, value: p.tensao_total_vertical.toFixed(2) });
      }
      if (p.pressao_neutra !== null && p.pressao_neutra !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - Pressão Neutra (kPa)`, value: p.pressao_neutra.toFixed(2) });
      }
      if (p.tensao_efetiva_vertical !== null && p.tensao_efetiva_vertical !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - Tensão Efetiva Vertical (kPa)`, value: p.tensao_efetiva_vertical.toFixed(2) });
      }
      if (temTensaoHorizontalExcel && p.tensao_efetiva_horizontal !== null && p.tensao_efetiva_horizontal !== undefined) {
        resultadosData.push({ label: `Ponto ${i + 1} - Tensão Efetiva Horizontal (kPa)`, value: p.tensao_efetiva_horizontal.toFixed(2) });
      }
    });

    const excelData: ExcelExportData = {
      moduleName: "tensoes-geostaticas",
      moduleTitle: "Tensões Geostáticas",
      sheets: [
        { name: "Configuração", data: configData },
        { name: "Camadas", data: camadasData },
        { name: "Resultados", data: resultadosData }
      ],
    };

    const success = await exportToExcel(excelData);
    if (success) {
      toast("Excel exportado!", { description: "O arquivo foi baixado com sucesso." });
    } else {
      toast("Erro ao exportar", { description: "Não foi possível gerar o Excel." });
    }
  };

  const onSubmit = async (data: FormInputValues) => {
    setIsCalculating(true);
    setApiError(null);
    setResults(null);

    let apiInput: TensoesGeostaticasInputAPI;
    try {
      const profNA = parseFloat(data.profundidadeNA);

      apiInput = {
        camadas: data.camadas.map((c, index) => {
          const espessura = parseFloat(c.espessura);
          const Ko = c.Ko && c.Ko !== "" ? parseFloat(c.Ko) : null;

          // Calcula profundidade da camada
          let profTopo = 0;
          for (let i = 0; i < index; i++) {
            profTopo += parseFloat(data.camadas[i].espessura);
          }
          const profBase = profTopo + espessura;

          // Determina quais γ são necessários
          const acimaDoNA = profBase <= profNA;
          const abaixoDoNA = profTopo >= profNA;
          const atravessaNA = !acimaDoNA && !abaixoDoNA;

          let gamaNat: number | null = null;
          let gamaSat: number | null = null;

          if (c.gamaNat && c.gamaNat !== "") gamaNat = parseFloat(c.gamaNat);
          if (c.gamaSat && c.gamaSat !== "") gamaSat = parseFloat(c.gamaSat);

          // Validação
          if (acimaDoNA && gamaNat === null) {
            throw new Error(`Camada ${index + 1} está acima do NA. γ natural é obrigatório.`);
          }
          if (abaixoDoNA && gamaSat === null) {
            throw new Error(`Camada ${index + 1} está abaixo do NA. γ saturado é obrigatório.`);
          }
          if (atravessaNA && (gamaNat === null || gamaSat === null)) {
            throw new Error(`Camada ${index + 1} atravessa o NA. Ambos γ natural e γ saturado são obrigatórios.`);
          }

          // Extrai NA e capilaridade da camada (se definidos)
          const profundidadeNACamada = c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null;
          const capilaridadeCamada = c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null;

          return {
            espessura,
            gama_nat: gamaNat !== null ? gamaNat : undefined,
            gama_sat: gamaSat !== null ? gamaSat : undefined,
            Ko: Ko !== null ? Ko : undefined, // Ko opcional
            impermeavel: c.impermeavel || false,
            profundidade_na_camada: profundidadeNACamada !== null ? profundidadeNACamada : undefined,
            altura_capilar_camada: capilaridadeCamada !== null ? capilaridadeCamada : undefined,
          };
        }),
        profundidade_na: profNA,
        altura_capilar: parseFloat(data.alturaCapilar),
        peso_especifico_agua: parseFloat(data.pesoEspecificoAgua),
      };
    } catch (parseError) {
      if (parseError instanceof Error) {
        setApiError(parseError.message);
        toast("Erro de Validação", { description: parseError.message });
      } else {
        setApiError("Erro ao processar os dados do formulário.");
        toast("Erro de Formulário", { description: "Verifique se todos os campos numéricos contêm valores válidos." });
      }
      setIsCalculating(false);
      return;
    }

    try {
      // Calcula localmente no frontend
      const resultado = calcularTensoesGeostaticas(apiInput);
      if (resultado.erro) {
        setApiError(resultado.erro);
        toast("Erro no Cálculo", { description: resultado.erro });
      } else {
        setResults(resultado);
        toast("Sucesso", { description: "Tensões geostáticas calculadas com sucesso." });
      }
    } catch (err) {
      let errorMessage = "Erro ao calcular tensões geostáticas.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      toast("Erro na Requisição", { description: errorMessage });
    } finally {
      setIsCalculating(false);
    }
  };

  const errors = form.formState.errors;
  const currentCamadaField = fields[currentCamadaIndex];
  const canSubmit = !isCalculating && form.formState.isValid && !apiError;

  // Prepara dados para componentes
  const camadasParaTabela = form.watch("camadas").map(c => ({
    nome: c.nome,
    espessura: parseFloat(c.espessura) || 0,
    profundidadeNA: c.profundidadeNA && c.profundidadeNA !== "" ? parseFloat(c.profundidadeNA) : null,
    capilaridade: c.capilaridade && c.capilaridade !== "" ? parseFloat(c.capilaridade) : null,
    gamaNat: c.gamaNat && c.gamaNat !== "" ? parseFloat(c.gamaNat) : null,
    gamaSat: c.gamaSat && c.gamaSat !== "" ? parseFloat(c.gamaSat) : null,
    Ko: c.Ko && c.Ko !== "" ? parseFloat(c.Ko) : null,
    impermeavel: c.impermeavel || false,
  }));

  // Coleta TODOS os NAs definidos nas camadas
  const niveisAgua = camadasParaTabela
    .map((c, index) => c.profundidadeNA !== null && c.profundidadeNA !== undefined ? {
      profundidade: c.profundidadeNA,
      capilaridade: c.capilaridade || 0,
      index
    } : null)
    .filter((na): na is { profundidade: number; capilaridade: number; index: number } => na !== null);

  // Para compatibilidade, pega o primeiro NA (usado em alguns lugares)
  const profNA = niveisAgua.length > 0 ? niveisAgua[0].profundidade : 999;
  const alturaCapilar = niveisAgua.length > 0 ? niveisAgua[0].capilaridade : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Tensões Geostáticas | EduSolos</title>
        <meta name="description" content="Calcule o perfil de tensões totais, efetivas e pressão neutra em profundidade. Ferramenta para análise de tensões geostáticas no solo." />
      </Helmet>
      <PrintHeader moduleTitle="Tensões Geostáticas" moduleName="tensoes-geostaticas" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="module-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:rotate-3">
            <Mountain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tensões Geostáticas</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Cálculo de tensões totais, efetivas e pressão neutra</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-tour="actions">
          <DialogExemplos onSelectExample={handleSelectExample} disabled={isCalculating} />
          <div data-tour="config-button">
            <DialogConfiguracoes configInicial={config} onConfirm={handleConfigChange} disabled={isCalculating} />
          </div>

          <TooltipProvider>
            <CalculationActions
              onSave={handleSaveClick}
              onLoad={() => setLoadDialogOpen(true)}
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              hasResults={!!results}
              isCalculating={isCalculating}
            />
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Formulário */}
        <Card className="glass flex flex-col p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="w-5 h-5" />
                Configuração do Perfil
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1.5">
                        <p className="font-semibold">💡 Como usar:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Clique nas camadas para editar os dados</li>
                          <li>• Use o botão "+" para adicionar novas camadas</li>
                          <li>• Defina o NA e capilaridade por camada</li>
                          <li>• Configure γw no botão "Configurações"</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 flex-1">
              <TooltipProvider>
                {/* Perfil de Solo Interativo */}
                <div className="space-y-2" data-tour="diagrama-camadas">
                  <DiagramaCamadas
                    camadas={camadasParaTabela}
                    profundidadeNA={profNA}
                    alturaCapilar={alturaCapilar}
                    niveisAgua={niveisAgua}
                    interactive={true}
                    onAddCamada={handleAddCamadaFromDiagram}
                    onEditCamada={handleEditCamadaFromDiagram}
                  />
                </div>
              </TooltipProvider>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border/50 mt-auto">
              <Button type="submit" disabled={!canSubmit} className="flex-1 h-10" data-tour="btn-calcular">
                <CalcIcon className="w-4 h-4 mr-1.5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button type="button" onClick={handleClear} variant="outline" disabled={isCalculating} className="h-10 w-full sm:w-auto">
                Limpar
              </Button>
            </CardFooter>
            {apiError && !isCalculating && (
              <div className="px-4 pb-3">
                <Alert variant="destructive" className="p-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Erro</AlertTitle>
                  <AlertDescription className="text-xs">{apiError}</AlertDescription>
                </Alert>
              </div>
            )}
          </form>
        </Card>

        {/* Resultados e Visualizações */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          {/* Tabs com Tabela e Perfil de Tensões */}
          {!isCalculating && results && results.pontos_calculo && results.pontos_calculo.length > 0 && (
            <Tabs defaultValue="tabela" className="w-full" data-tour="tabs-resultados">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tabela">Tabela de Resultados</TabsTrigger>
                <TabsTrigger value="grafico">Perfil de Tensões</TabsTrigger>
              </TabsList>
              <TabsContent value="tabela" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <TabelaResultados pontos={results.pontos_calculo} profundidadeNA={profNA} alturaCapilar={alturaCapilar} niveisAgua={niveisAgua} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="grafico" className="mt-4">
                <div id="perfil-tensoes-chart">
                  <PerfilTensoes pontos={results.pontos_calculo} profundidadeNA={profNA} niveisAgua={niveisAgua} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        saveName={saveName}
        onSaveNameChange={setSaveName}
        onConfirm={handleConfirmSave}
      />

      <ExportPDFDialog
        open={exportPDFDialogOpen}
        onOpenChange={setExportPDFDialogOpen}
        fileName={pdfFileName}
        onFileNameChange={setPdfFileName}
        onConfirm={handleConfirmExportPDF}
        isExporting={isExportingPDF}
      />

      <SavedCalculations
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        calculations={calculations}
        onLoad={handleLoadCalculation}
        onDelete={deleteCalculation}
        onRename={renameCalculation}
        moduleName="Tensões Geostáticas"
      />
    </div>
  );
}

// Wrapper principal
export default function TensoesGeostaticas() {
  return <TensoesGeostaticasDesktop />;
}

