import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Zap, Wifi, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PWA_DISMISSED_KEY = 'pwa-install-dismissed';

export function PWAUpdateNotification() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      // Verifica se o usuário já dispensou o prompt
      const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
      if (dismissed === 'true') {
        return;
      }

      setDeferredPrompt(e);
      
      // Mostra o prompt após um delay de 3 segundos
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // Detecta quando o app foi instalado com sucesso
    const handleAppInstalled = () => {
      setShowSuccess(true);
      setShowInstallPrompt(false);
      setIsInstalling(false);
      
      // Esconde a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('Usuário aceitou a instalação');
          // A mensagem de sucesso será mostrada pelo evento 'appinstalled'
        } else {
          // Usuário cancelou
          setIsInstalling(false);
        }
      } catch (error) {
        console.error('Erro ao instalar:', error);
        setIsInstalling(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setShowInstallPrompt(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Ilustração/Ícone */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-xl">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-4 border-background">
            <Download className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Acesso Rápido</h4>
            <p className="text-xs text-muted-foreground">Abra direto da tela inicial, sem navegador</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Funciona Offline</h4>
            <p className="text-xs text-muted-foreground">Use mesmo sem conexão com a internet</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Experiência Nativa</h4>
            <p className="text-xs text-muted-foreground">Interface otimizada como um app real</p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="space-y-2">
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          className="w-full h-12 text-base font-semibold gap-2 shadow-lg relative overflow-hidden"
          size="lg"
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Aguarde...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Instalar Aplicativo
            </>
          )}
        </Button>
        
        {!isInstalling && (
          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              Agora não
            </Button>
            <Button
              onClick={handleNeverShow}
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-foreground"
            >
              Não mostrar novamente
            </Button>
          </div>
        )}
        
        {isInstalling && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Aguardando confirmação no navegador...
          </p>
        )}
      </div>
    </div>
  );

  // Mostra toast de sucesso quando instalado
  useEffect(() => {
    if (showSuccess) {
      toast.success('🎉 Aplicativo instalado com sucesso!', {
        description: 'O EduSolo agora está disponível na sua tela inicial!',
        duration: 5000,
        action: {
          label: 'Fechar',
          onClick: () => setShowSuccess(false),
        },
      });
    }
  }, [showSuccess]);

  // Renderiza Sheet para mobile e Dialog para desktop
  if (isMobile) {
    return (
      <Sheet open={showInstallPrompt} onOpenChange={!isInstalling ? setShowInstallPrompt : undefined}>
        <SheetContent 
          side="bottom" 
          className="rounded-t-2xl border-t-4 border-t-primary"
          onInteractOutside={(e) => {
            // Previne fechar durante instalação
            if (isInstalling) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className="text-left space-y-2 mb-6">
            <SheetTitle className="text-xl">
              {isInstalling ? 'Instalando...' : 'Instalar EduSolo'}
            </SheetTitle>
            <SheetDescription>
              {isInstalling 
                ? 'Aguarde enquanto preparamos tudo para você...'
                : 'Tenha o EduSolo sempre à mão! Instale em seu dispositivo para uma experiência completa.'
              }
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={!isInstalling ? setShowInstallPrompt : undefined}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          // Previne fechar durante instalação
          if (isInstalling) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            {isInstalling ? 'Instalando...' : 'Instalar EduSolo'}
          </DialogTitle>
          <DialogDescription>
            {isInstalling 
              ? 'Aguarde enquanto preparamos tudo para você...'
              : 'Tenha o EduSolo sempre à mão! Instale em seu dispositivo para uma experiência completa.'
            }
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

