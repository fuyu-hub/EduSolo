// Funções auxiliares para as funcionalidades de salvamento/exportação em todas as páginas

export const createSaveHandlers = (
  moduleName: string,
  saveCalculation: (name: string, formData: any, results: any) => boolean,
  toast: any,
  setSaveDialogOpen: (open: boolean) => void,
  setSaveName: (name: string) => void
) => {
  const handleSaveClick = (results: any) => {
    if (!results) return;
    setSaveName(`Cálculo ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = (saveName: string, formData: any, results: any) => {
    if (!results || !saveName.trim()) return;
    
    const success = saveCalculation(saveName.trim(), formData, results);
    if (success) {
      toast({
        title: "Cálculo salvo!",
        description: "O cálculo foi salvo com sucesso.",
      });
      setSaveDialogOpen(false);
      setSaveName("");
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cálculo.",
        variant: "destructive",
      });
    }
  };

  return { handleSaveClick, handleConfirmSave };
};

export const createLoadHandler = (
  setFormData: (data: any) => void,
  setResults: (results: any) => void,
  toast: any
) => {
  return (calculation: any) => {
    setFormData(calculation.formData);
    setResults(calculation.results);
    toast({
      title: "Cálculo carregado!",
      description: `"${calculation.name}" foi carregado com sucesso.`,
    });
  };
};

export const handlePrint = () => {
  window.print();
};

