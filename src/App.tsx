import React from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { useIntl } from 'react-intl';

import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

import AirHumidity from './comp/AirHumidity';
import Thermal from './comp/Thermal';
import FlightLevels from './comp/FlightLevels';

function App() {
  const intl = useIntl();

  return (
    <BrowserRouter basename={import.meta.env.PUBLIC_URL}>
      <div className='velitherm-visu'>
        <header className='header d-flex flex-row'>
          <div className='label2'>
            <Routes>
              <Route key='Air Humidity' path={'/'} element={
                <div>
                  {
                    intl.formatMessage({ defaultMessage: 'Air Humidity', id: 'v3EBLt' })
                  }
                </div>} />
              <Route key='Thermal Profile' path={'/thermal/'} element={
                <div>
                  {
                    intl.formatMessage({ defaultMessage: 'Thermal Profile', id: 'eeYz2i' })
                  }
                </div>} />
              <Route key='Thermal Profile' path={'/FL/'} element={
                <div>
                  {
                    intl.formatMessage({ defaultMessage: 'Flight Level', id: 'flight_level' })
                  }
                </div>} />
            </Routes>
          </div>
          <div className='d-flex flex-row justify-content-around px-4'>
            <Link className='btn btn-primary mx-4' to='/'>{
              intl.formatMessage({ defaultMessage: 'Air Humidity', id: 'v3EBLt' })
            }</Link>
            <Link className='btn btn-primary mx-4' to='/thermal/'>{
              intl.formatMessage({ defaultMessage: 'Thermal Profile', id: 'eeYz2i' })
            }</Link>
            <Link className='btn btn-primary mx-4' to='/FL/'>{
              intl.formatMessage({ defaultMessage: 'Flight Level', id: 'flight_level' })
            }</Link>
          </div>
        </header>
        <Routes>
          <Route key='Air Humidity' path={'/'} element={<AirHumidity />} />
          <Route key='Thermal Profile' path={'/thermal/'} element={<Thermal />} />
          <Route key='Flight Levels' path={'/FL/'} element={<FlightLevels />} />
        </Routes>
      </div>
      <footer className='m-4'>
        <small>
          <p>All values computed by <a href='https://github.com/mmomtchev/velitherm'>velitherm</a>, Momtchil Momtchev, <a href='https://www.meteo.guru'>meteo.guru</a>/<a href='https://www.velivole.fr'>velivole.fr</a>, 2022-2025</p>
          <p><a href='https://github.com/mmomtchev/velitherm-visu'>Source code</a> under GPL license</p>
          <p>buttons by KP Arts from NounProject.com</p>
          <p>Build {import.meta.env.VITE_BUILD}</p>
        </small>
      </footer>
    </BrowserRouter>
  );
}

export default App;
