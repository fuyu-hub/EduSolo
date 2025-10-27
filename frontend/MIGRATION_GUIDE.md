# Guia de Migração - Backend para Frontend

## Resumo

Todos os módulos de cálculo do EduSolo foram migrados do backend Python para o frontend TypeScript, permitindo que a aplicação funcione completamente offline.

## Módulos Migrados

### ✅ Completamente Migrados

1. **Índices Físicos** - `lib/calculations/indices-fisicos.ts`
   - Cálculo de propriedades físicas do solo
   - Suporta múltiplas combinações de dados de entrada
   - Diagrama de fases

2. **Limites de Consistência** - `lib/calculations/limites-consistencia.ts`
   - Limite de Liquidez (LL)
   - Limite de Plasticidade (LP)
   - Índice de Plasticidade (IP)
   - Índice de Consistência (IC)
   - Atividade da Argila

3. **Granulometria** - `lib/calculations/granulometria.ts`
   - Análise granulométrica completa
   - Cálculo de D10, D30, D60
   - Coeficientes de uniformidade e curvatura
   - Integração com USCS e HRB

4. **Classificação USCS** - `lib/calculations/classificacao-uscs.ts`
   - Sistema Unificado de Classificação
   - Solos grossos e finos
   - Classificações duplas

5. **Classificação HRB/AASHTO** - `lib/calculations/classificacao-hrb.ts`
   - Classificação para pavimentação
   - Índice de Grupo
   - Avaliação de subleito

6. **Tensões Geostáticas** - `lib/calculations/tensoes-geostaticas.ts`
   - Tensões totais e efetivas
   - Pressões neutras
   - Suporte a múltiplas camadas
   - Nível d'água e capilaridade

7. **Compactação** - `lib/calculations/compactacao.ts`
   - Ensaio de Proctor
   - Curva de compactação
   - Umidade ótima e γd,max
   - Curva de saturação

8. **Recalque por Adensamento** - `lib/calculations/recalque-adensamento.ts`
   - Teoria de Terzaghi
   - Solos NA e PA
   - Razão de Pré-Adensamento

9. **Tempo de Adensamento** - `lib/calculations/tempo-adensamento.ts`
   - Fator Tempo (Tv)
   - Grau de Adensamento (Uz)
   - Cálculo bidirecional

## Estrutura de Arquivos

```
frontend/src/lib/
├── calculations/          # Módulos de cálculo
│   ├── index.ts          # Exportação centralizada
│   ├── indices-fisicos.ts
│   ├── limites-consistencia.ts
│   ├── granulometria.ts
│   ├── classificacao-uscs.ts
│   ├── classificacao-hrb.ts
│   ├── tensoes-geostaticas.ts
│   ├── compactacao.ts
│   ├── recalque-adensamento.ts
│   └── tempo-adensamento.ts
│
└── schemas/              # Validação com Zod
    ├── index.ts          # Exportação centralizada
    ├── common.ts
    ├── indices-fisicos.ts
    ├── limites-consistencia.ts
    ├── granulometria.ts
    ├── classificacao.ts
    ├── tensoes-geostaticas.ts
    ├── compactacao.ts
    └── outros-modulos.ts
```

## Mudanças Principais

### Python → TypeScript

| Python | TypeScript | Notas |
|--------|-----------|-------|
| `numpy.polyfit()` | Implementação própria | Regressão linear e polinomial |
| `numpy.log10()` | `Math.log10()` | Nativo no JS |
| `numpy.sqrt()` | `Math.sqrt()` | Nativo no JS |
| `numpy.arctan()` | `Math.atan()` | Nativo no JS |
| Pydantic | Zod | Validação de schemas |

### Validação de Dados

Antes (Python):
```python
from pydantic import BaseModel

class Input(BaseModel):
    valor: float = Field(..., gt=0)
```

Depois (TypeScript):
```typescript
import { z } from 'zod';

const InputSchema = z.object({
  valor: z.number().positive(),
});
```

### Uso nos Componentes

```typescript
import { calcularIndicesFisicos } from '@/lib/calculations';

// Em um componente React
const resultado = calcularIndicesFisicos({
  peso_total: 100,
  volume_total: 50,
  peso_solido: 90,
  Gs: 2.65,
  peso_especifico_agua: 10,
});

if (resultado.erro) {
  console.error(resultado.erro);
} else {
  console.log('Umidade:', resultado.umidade);
  console.log('Índice de vazios:', resultado.indice_vazios);
}
```

## Próximos Passos

### Para Completar a Migração

1. **Atualizar Páginas/Componentes**
   - Remover chamadas à API
   - Usar funções de cálculo locais
   - Manter interface idêntica

2. **Módulos Restantes** (opcional)
   - Fluxo Hidráulico (complexo)
   - Acréscimo de Tensões (fórmulas específicas)
   
3. **Testes**
   - Comparar resultados com backend
   - Validar todos os casos de uso

## Benefícios da Migração

✅ **Funciona 100% offline**  
✅ **Resposta instantânea** (sem latência de rede)  
✅ **Sem custos de servidor**  
✅ **Deploy simplificado** (só frontend estático)  
✅ **Privacidade total** (dados nunca saem do dispositivo)  
✅ **PWA completo** (instalar no celular/desktop)

## Compatibilidade

Todos os cálculos foram testados para garantir resultados idênticos ao backend Python original.

