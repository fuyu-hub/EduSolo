// IsometricCube removed

interface PrintHeaderProps {
  moduleTitle: string;
  moduleName: string;
}

export default function PrintHeader({ moduleTitle, moduleName }: PrintHeaderProps) {
  const currentDate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-header hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon-48x48.png" alt="EduSolos Logo" className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold">EduSolos</h1>
            <p className="text-sm text-muted-foreground">Ferramentas de Mecânica dos Solos</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{moduleTitle}</p>
          <p className="text-xs text-muted-foreground print-date">{currentDate}</p>
        </div>
      </div>
    </div>
  );
}

