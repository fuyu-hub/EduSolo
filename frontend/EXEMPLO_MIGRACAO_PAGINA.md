# Exemplo de Migração de Página - IndicesFisicos.tsx

## Mudanças Necessárias

### 1. Remover dependência do axios

**ANTES:**
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

**DEPOIS:**
```typescript
import { calcularIndicesFisicos } from '@/lib/calculations';
// Remover: import axios from 'axios';
// Remover: const API_URL = ...
```

### 2. Atualizar função handleCalculate

**ANTES (linhas 269-337):**
```typescript
const handleCalculate = async () => {
  setIsCalculating(true);
  setError(null);
  setResults(null);

  const apiInput: { [key: string]: number | undefined } = {
    peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
    peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
    volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
    Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
    peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
    indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
    indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
  };

  Object.keys(apiInput).forEach(key => 
    (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]
  );

  // Validação
  if (apiInput.indice_vazios_min !== undefined && apiInput.indice_vazios_max !== undefined && 
      apiInput.indice_vazios_min >= apiInput.indice_vazios_max) {
    setError("Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).");
    toast({ /* ... */ });
    setIsCalculating(false);
    return;
  }

  try {
    // ❌ Chamada à API (remover)
    const response = await axios.post<IndicesFisicosOutput>(
      `${API_URL}/calcular/indices-fisicos`, 
      apiInput
    );

    if (response.data.erro) {
      setError(response.data.erro);
      toast({ /* ... */ });
    } else {
      setResults(response.data);
    }
  } catch (err) {
    // Tratamento de erro de rede
    // ...
  } finally {
    setIsCalculating(false);
  }
};
```

**DEPOIS:**
```typescript
const handleCalculate = async () => {
  setIsCalculating(true);
  setError(null);
  setResults(null);

  // Preparar dados de entrada (mesma lógica)
  const apiInput: { [key: string]: number | undefined } = {
    peso_total: formData.massaUmida ? parseFloat(formData.massaUmida) : undefined,
    peso_solido: formData.massaSeca ? parseFloat(formData.massaSeca) : undefined,
    volume_total: formData.volume ? parseFloat(formData.volume) : undefined,
    Gs: formData.Gs ? parseFloat(formData.Gs) : undefined,
    peso_especifico_agua: formData.pesoEspecificoAgua ? parseFloat(formData.pesoEspecificoAgua) : 10.0,
    indice_vazios_max: formData.indice_vazios_max ? parseFloat(formData.indice_vazios_max) : undefined,
    indice_vazios_min: formData.indice_vazios_min ? parseFloat(formData.indice_vazios_min) : undefined,
  };

  Object.keys(apiInput).forEach(key => 
    (apiInput[key] === undefined || isNaN(apiInput[key] as number)) && delete apiInput[key]
  );

  // Validação (mantida)
  if (apiInput.indice_vazios_min !== undefined && apiInput.indice_vazios_max !== undefined && 
      apiInput.indice_vazios_min >= apiInput.indice_vazios_max) {
    setError("Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).");
    toast({
      title: "Erro de Entrada",
      description: "Índice de vazios mínimo (emin) deve ser menor que o máximo (emax).",
      variant: "destructive",
    });
    setIsCalculating(false);
    return;
  }

  // ✅ Chamada LOCAL (sem rede!)
  try {
    // Simular pequeno delay para UX (opcional)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Calcular localmente
    const resultado = calcularIndicesFisicos(apiInput);

    if (resultado.erro) {
      setError(resultado.erro);
      toast({
        title: "Erro no Cálculo",
        description: resultado.erro,
        variant: "destructive",
      });
    } else {
      setResults(resultado);
    }
  } catch (err) {
    // Erro improvável agora (não há rede envolvida)
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no cálculo";
    setError(errorMessage);
    toast({
      title: "Erro no Cálculo",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsCalculating(false);
  }
};
```

## Benefícios Imediatos

1. ✅ **Funciona offline** - Sem necessidade de backend
2. ✅ **Resposta instantânea** - Cálculo local é muito mais rápido
3. ✅ **Sem erros de rede** - Não há mais "Não foi possível conectar ao servidor"
4. ✅ **Privacidade total** - Dados nunca saem do dispositivo
5. ✅ **PWA completo** - Instalar e usar como app nativo

## Aplicar a Mesma Mudança em Outras Páginas

Use o mesmo padrão para:
- ✅ `LimitesConsistencia.tsx` → `calcularLimitesConsistencia()`
- ✅ `Granulometria.tsx` → `calcularGranulometria()`
- ✅ `TensoesGeostaticas.tsx` → `calcularTensoesGeostaticas()`
- ✅ `Compactacao.tsx` → `calcularCompactacao()`
- ✅ E todas as outras...

## Comparação Lado a Lado

| Aspecto | Com Backend | Sem Backend (Local) |
|---------|-------------|---------------------|
| **Velocidade** | ~200-500ms (rede) | ~10-50ms (local) |
| **Offline** | ❌ Não funciona | ✅ Funciona sempre |
| **Privacidade** | Dados enviados | Dados ficam no dispositivo |
| **Deploy** | Backend + Frontend | Só Frontend (estático) |
| **Custo** | Servidor necessário | Grátis (Netlify/Vercel) |
| **Manutenção** | 2 projetos | 1 projeto |

## Próximo Passo

Basta aplicar essas mudanças em todas as páginas que fazem cálculos!

O código ficará **mais simples**, **mais rápido** e **mais confiável**! 🚀

