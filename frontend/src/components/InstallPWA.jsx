import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(false);
    useEffect(() => {
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);
    if (!deferredPrompt || installed)
        return null;
    const handleInstall = async () => {
        if (!deferredPrompt)
            return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };
    return (<button onClick={handleInstall} className="btn btn-primary text-sm flex items-center gap-1">
      <Download className="w-4 h-4"/>
      <span className="hidden sm:inline">Установить приложение</span>
    </button>);
}
