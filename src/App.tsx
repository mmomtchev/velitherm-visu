import React from 'react';
import 'bootstrap/dist/css/bootstrap.css'
import './App.css';

import AirHumidity from './comp/AirHumidity';

function App() {
  return (
    <div className="velitherm-visu">
      <header className="header">
        Air Humidity
      </header>
      <AirHumidity />
    </div>
  );
}

export default App;
