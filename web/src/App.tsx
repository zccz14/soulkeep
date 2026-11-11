import { GlobeIcon, InfoIcon, LayersIcon } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@zccz14/ux';
import { useAuthMini } from 'auth-mini-react-components';
import { SoulkeepMark } from './mark';
import { DeskPage } from './pages/desk';
import { PlazaPage } from './pages/plaza';
import { ProductPage } from './pages/product';
import { SkeletonPage } from './pages/skeleton';
import { SoulPage } from './pages/soul';
import { AboutPage } from './pages/about';

export function App() {
  const { isReady } = useAuthMini();

  if (!isReady) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        <span className="size-5 animate-pulse rounded-full bg-foreground/30" />
      </main>
    );
  }

  return (
    <AppLayout
      logo={<SoulkeepMark />}
      title="Soulkeep"
      nav={[
        {
          label: '工作台',
          items: [
            { to: '/', label: '创始人桌面', icon: <LayersIcon /> },
            { to: '/plaza', label: '产品广场', icon: <GlobeIcon /> },
            { to: '/about', label: '四条', icon: <InfoIcon /> },
          ],
        },
      ]}
    >
      <Routes>
        <Route path="/" element={<DeskPage />} />
        <Route path="/plaza" element={<PlazaPage />} />
        <Route path="/p/:slug" element={<ProductPage />} />
        <Route path="/p/:slug/soul" element={<SoulPage />} />
        <Route path="/p/:slug/skeleton" element={<SkeletonPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </AppLayout>
  );
}
