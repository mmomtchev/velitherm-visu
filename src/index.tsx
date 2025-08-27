import React from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import './index.css';
import App from './App';

import fr from './compiled-lang/fr.json';
import en from './compiled-lang/en.json';

const messages = { fr, en };

// eslint-disable-next-line react-refresh/only-export-components
const IntlApp = () => {
  const [searchParams] = useSearchParams();
  const queryLang = searchParams.get('lang');
  const userLang = (navigator.language || 'en-US').split('-')[0];
  const siteLang = (queryLang ?? (['fr', 'en'].includes(userLang) ? userLang : 'en')) as 'fr' | 'en';

  return <IntlProvider
    locale={userLang}
    defaultLocale="en"
    messages={messages[siteLang]}
  >
    <App />
  </IntlProvider>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <IntlApp />
    </BrowserRouter>
  </React.StrictMode>
);
