import React from 'react';
import ReactDOM from "react-dom/client";
import './index.css';
import App from './App';

import { IntlProvider } from 'react-intl';

import fr from './compiled-lang/fr.json';
import en from './compiled-lang/en.json';

const userLang = (navigator.language || 'en-US').split('-')[0];
const siteLang = (['fr', 'en'].includes(userLang) ? userLang : 'en') as 'fr' | 'en';
const messages = { fr, en };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IntlProvider
      locale={userLang}
      defaultLocale="en"
      messages={messages[siteLang]}
    >
      <App />
    </IntlProvider>
  </React.StrictMode>
);
