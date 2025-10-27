import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function PWAUpdateNotification() {
  const { toast } = useToast();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Verifica por atualizações a cada 30 minutos
        setInterval(() => {
          reg.update();
        }, 30 * 60 * 1000);
      });

      // Detecta quando há uma nova versão disponível
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Mostra notificação de atualização disponível
        toast({
          title: '✨ Nova versão disponível!',
          description: 'A aplicação foi atualizada. Recarregue a página para ver as novidades.',
          action: (
            <Button
              size="sm"
              onClick={() => {
                window.location.reload();
              }}
            >
              Recarregar
            </Button>
          ),
          duration: 10000,
        });
      });
    }
  }, [toast]);

  // Adiciona suporte para instalação do PWA
  useEffect(() => {
    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;

      // Mostra toast para instalar o PWA
      toast({
        title: '📱 Instalar EduSolo',
        description: 'Instale o EduSolo como aplicativo no seu dispositivo para acesso rápido!',
        action: (
          <Button
            size="sm"
            onClick={async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
                deferredPrompt = null;
              }
            }}
          >
            Instalar
          </Button>
        ),
        duration: 15000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  return null;
}

