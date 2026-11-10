import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthMiniProvider } from 'auth-mini-react-components';
import { LinkitProvider } from 'linkit-react-components';
import { HashRouter } from 'react-router-dom';

import '@zccz14/ux/styles.css';
import 'linkit-react-components/styles.css';
import './style.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('缺少 #root');

createRoot(root).render(
  <StrictMode>
    <AuthMiniProvider
      authMiniBaseUrl="https://auth.ntnl.io"
      audiences={['soulkeep.ntnl.io', 'cybion.ntnl.io', 'linkit.ntnl.io']}
      autoRedirectToLogin={false}
    >
      <LinkitProvider linkitBaseUrl="https://linkit.ntnl.io" lang="zh-CN">
        <HashRouter>
          <App />
        </HashRouter>
      </LinkitProvider>
    </AuthMiniProvider>
  </StrictMode>,
);
