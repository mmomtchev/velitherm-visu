import React from 'react';
import { useIntl } from 'react-intl';

import Slider from './Slider';

import * as velitherm from 'velitherm';

const Tmin = -30;
const Tmax = 20;
const Pmin = 1000;
const Pmax = 1025;
const FLmin = 50;
const FLmax = 350;

const FlightLevels = () => {
  const intl = useIntl();

  const [T, setT] = React.useState(-3);
  const [P0, setP0] = React.useState(velitherm.P0);
  const [FL, setFL] = React.useState(115);
  const [P, setP] = React.useState(velitherm.pressureFromFL(FL));
  const [alt, setAlt] = React.useState(velitherm.altitudeFromPressure(P, P0, T));
  const [T0, setT0] = React.useState(T + (alt / 2) * velitherm.gamma);
  const [altStd, setAltStd] = React.useState(velitherm.altitudeFromStandardPressure(P));
  const [altMin, setAltMin] = React.useState(velitherm.altitudeFromPressure(P, Pmin, Tmin));
  const [altMax, setAltMax] = React.useState(velitherm.altitudeFromPressure(P, Pmax, Tmax));

  const fromFL = (newFL: number) => {
    const newP = velitherm.pressureFromFL(newFL);
    const newAlt = velitherm.altitudeFromPressure(newP, P0, T);
    setFL(newFL);
    setP(newP);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin, Tmin));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax, Tmax));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
    setT0(T + (newAlt / 2) * velitherm.gamma);
  };

  const fromPressure = (newP: number) => {
    const newAlt = velitherm.altitudeFromPressure(newP, P0, T);
    setP(newP);
    setFL(velitherm.FLFromPressure(newP));
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin, Tmin));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax, Tmax));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
    setT0(T + (newAlt / 2) * velitherm.gamma);
  };

  const fromP0 = (newP0: number) => {
    const newAlt = velitherm.altitudeFromPressure(P, newP0, T);
    setP0(newP0);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin, Tmin));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax, Tmax));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
    setT0(T + (newAlt / 2) * velitherm.gamma);
  };

  const fromT = (newT: number) => {
    const newAlt = velitherm.altitudeFromPressure(P, P0, newT);
    setT(newT);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin, Tmin));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax, Tmax));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
    setT0(T + (newAlt / 2) * velitherm.gamma);
  };

  return (
    <div className='d-flex flex-row'>
      <div className='border shadow m-1 my-3'>
        <div className='border m-1 p-1'>
          <div className='m-1 p-1'>Flight Level</div>
          <Slider title={intl.formatMessage({ defaultMessage: 'Flight Level', id: 'flight_level' })}
            units='FL' value={FL} prefix={true}
            min={FLmin} scale={0} max={FLmax} step={5}
            onChange={fromFL} />
          <Slider title={intl.formatMessage({ defaultMessage: 'Pressure at given level', id: 'pressure_level' })}
            units='hPa' value={P} scale={0} step={1}
            min={velitherm.pressureFromFL(FLmax)} max={velitherm.pressureFromFL(FLmin)}
            onChange={fromPressure} />
        </div>
        <div className='border m-1 p-1'>
          <div className='m-1 p-1'>Conditions</div>
          <Slider title={intl.formatMessage({ defaultMessage: 'Pressure at the ground reduced to AMSL', id: 'pressure_ground' })}
            units='hPa' value={P0}
            min={950} max={1050} scale={0} step={1}
            onChange={fromP0} />
          <Slider title={intl.formatMessage({ defaultMessage: 'Mean temperature of the air column', id: 'temp_air_column' })}
            units='°C' value={T}
            min={Tmin - 30} max={Tmax + 10} scale={0} step={1}
            onChange={fromT} />
        </div>
      </div>
      <div className='border shadow m-1 my-3 p-2'>
        <div className='border shadow m-1 p-1'>
          {intl.formatMessage({ defaultMessage: 'Altitude of', id: 'alt_of'})}&nbsp;<strong>FL {Math.round(FL)}</strong>
          </div>
        <div className='container m-1 my-3'>
          <div className='row'>
            <div className='col-8'>{intl.formatMessage({defaultMessage:'In bad winter weather', id: 'bad_winter'})}&nbsp;({Pmin} hPa, {Tmin}°C)</div>
            <div className='col-4'><strong>{Math.round(altMin)} m</strong></div>
          </div>
          <div className='row'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'In ICAO standard conditions', id: 'icao_std' })}&nbsp;</div>
            <div className='col-4'><strong>{Math.round(altStd)} m</strong></div>
          </div>
          <div className='row'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'At the given conditions', id: 'given_conditions' })}&nbsp;</div>
            <div className='col-4'><strong>{Math.round(alt)} m</strong></div>
          </div>
          <div className='row'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'During a summer heat wave', id: 'heat_wave' })}&nbsp;({Pmax} hPa, {Tmax}°C)</div>
            <div className='col-4'><strong>{Math.round(altMax)} m</strong></div>
          </div>
          <div className='row'>
            &nbsp;
          </div>
          <div className='row'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'Air temperature at MSL in calm air', id: 'temp_amsl' })}</div>
            <div className='col-4'><strong>{Math.round(T0)} °C</strong></div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default FlightLevels;
