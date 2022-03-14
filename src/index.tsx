import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { IntlProvider } from 'react-intl';

import fr from './compiled-lang/fr.json';
import en from './compiled-lang/en.json';

const userLang = (navigator.language || 'en-US').split('-')[0];
const messages = { fr, en};

ReactDOM.render(
  <React.StrictMode>
    <IntlProvider
      locale={userLang}
      defaultLocale="en"
      messages={messages[userLang]}
    >
      <App />
    </IntlProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
