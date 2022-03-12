import React from 'react';
import 'bootstrap/dist/css/bootstrap.css'
import './App.css';

import AirHumidity from './comp/AirHumidity';

function App() {
  return (
    <React.Fragment>
      <div className="velitherm-visu">
        <header className="header">
          Air Humidity
        </header>
        <AirHumidity />
      </div>
      <footer className='m-4'>
        <small>
          <p>All values computed by <a href="https://github.com/mmomtchev/velitherm">velitherm</a>, Momtchil Momtchev, <a href="https://www.meteo.guru">meteo.guru</a>/<a href="https://www.velivole.fr">velivole.fr</a>, 2022</p>
          <p><a href="https://github.com/mmomtchev/velitherm-visu">Source code</a> under GPL license</p>
          <p>buttons by KP Arts from NounProject.com</p>
          <p>Build from {process.env.REACT_APP_BUILD}</p>
        </small>
      </footer>
    </React.Fragment>
  );
}

export default App;
