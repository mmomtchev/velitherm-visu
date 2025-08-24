import React from 'react';
import { useIntl } from 'react-intl';

import Slider from './Slider';

import * as velitherm from 'velitherm';

const Tmin = -20;
const Tmax = 40;
const Pmin = 1000;
const Pmax = 1025;
const FLmin = 50;
const FLmax = 350;

const Altitude = (props: {v: number}) => {
  return <div className='d-flex flex-column'>
    <strong className='text-nowrap'>{Math.round(props.v)} m</strong>
    <em className='text-nowrap'>{Math.round(props.v * velitherm.feetPerMeter)} ft</em>
  </div>
};

const FlightLevels = () => {
  const intl = useIntl();

  const [T0, setT0] = React.useState(velitherm.T0);
  const [P0, setP0] = React.useState(velitherm.P0);
  const [FL, setFL] = React.useState(115);
  const [P, setP] = React.useState(velitherm.pressureFromFL(FL));
  const [T, setT] = React.useState(velitherm.adiabaticCooling(T0, P, P0));
  const [Tmean, setTmean] = React.useState((T0 + T) / 2);
  const [alt, setAlt] = React.useState(velitherm.altitudeFromPressure(P, P0, Tmean));
  const [altStd, setAltStd] = React.useState(velitherm.altitudeFromStandardPressure(P));
  const [altMin, setAltMin] = React.useState(velitherm.altitudeFromPressure(P, Pmin, (Tmin + velitherm.adiabaticCooling(Tmin, P, P0)) / 2));
  const [altMax, setAltMax] = React.useState(velitherm.altitudeFromPressure(P, Pmax, (Tmax + velitherm.adiabaticCooling(Tmax, P, P0)) / 2));

  const fromFL = (newFL: number) => {
    const newP = velitherm.pressureFromFL(newFL);
    const newT = velitherm.adiabaticCooling(T0, newP, P0);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(newP, P0, newTmean);
    setFL(newFL);
    setP(newP);
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin, (Tmin + velitherm.adiabaticCooling(Tmin, newP, P0)) / 2));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax, (Tmax + velitherm.adiabaticCooling(Tmax, newP, P0)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
  };

  const fromPressure = (newP: number) => {
    const newT = velitherm.adiabaticCooling(T0, newP, P0);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(newP, P0, newTmean);
    setP(newP);
    setFL(velitherm.FLFromPressure(newP));
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin, (Tmin + velitherm.adiabaticCooling(Tmin, newP, P0)) / 2));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax, (Tmax + velitherm.adiabaticCooling(Tmax, newP, P0)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
  };

  const fromP0 = (newP0: number) => {
    const newT = velitherm.adiabaticCooling(T0, P, newP0);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(P, newP0, newTmean);
    setP0(newP0);
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin, (Tmin + velitherm.adiabaticCooling(Tmin, P, newP0)) / 2));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax, (Tmax + velitherm.adiabaticCooling(Tmax, P, newP0)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
  };

  const fromT0 = (newT0: number) => {
    const newT = velitherm.adiabaticCooling(newT0, P, P0);
    const newTmean = (newT0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(P, P0, newTmean);
    setT0(newT0);
    setTmean(newTmean);
    setT(newT);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin, (Tmin + velitherm.adiabaticCooling(Tmin, P, P0)) / 2));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax, Tmax));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
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
            <div className='container'>
          <div className='row align-items-center my-3'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'Virtual altitude displayed on the altimeter in QNH mode', id: 'altimeter_QNH' })}</div>
            <div className='col-4'><Altitude v={FL * 100 / velitherm.feetPerMeter} /></div>
            </div>
          </div>
        </div>
        <div className='border m-1 p-1'>
          <div className='m-1 p-1'>Conditions</div>
          <Slider title={intl.formatMessage({ defaultMessage: 'Pressure at the ground reduced to MSL', id: 'pressure_ground' })}
            units='hPa' value={P0}
            min={950} max={1050} scale={0} step={1}
            onChange={fromP0} />
          <div className='border m-0 p-0'>
            <Slider title={intl.formatMessage({ defaultMessage: 'Air temperature at MSL', id: 'temp_air_msl' })}
              units='°C' value={T0}
              min={Tmin} max={Tmax} scale={0} step={1}
              onChange={fromT0} />
            <div className='container'>
              <div className='row'>
                <div className='col-8'>{intl.formatMessage({ defaultMessage: 'Air temperature at the given level', id: 'temp_level' })}</div>
                <div className='col-4'><strong className='text-nowrap'>{Math.round(T)} °C</strong></div>
              </div>
              <div className='row'>
                <div className='col-8'>{intl.formatMessage({ defaultMessage: 'Mean temperature of the air column', id: 'temp_column' })}</div>
                <div className='col-4'><strong className='text-nowrap'>{Math.round(Tmean)} °C</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='border shadow m-1 my-3 p-2'>
        <div className='border shadow m-1 p-1'>
          {intl.formatMessage({ defaultMessage: 'Altitude of', id: 'alt_of' })}&nbsp;<strong>FL {Math.round(FL)}</strong>
        </div>
        <div className='container m-1 my-3'>
          <div className='row align-items-center'>
            <div className='col-8 '>{intl.formatMessage({ defaultMessage: 'At the given conditions', id: 'given_conditions' })}&nbsp;</div>
            <div className='col-4'><Altitude v={alt} /></div>
          </div>
          <div className='row align-items-center'>
            <hr />
          </div>
          <div className='row align-items-center my-3'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'In bad winter weather', id: 'bad_winter' })}&nbsp;({Pmin} hPa, {Tmin}°C)</div>
            <div className='col-4'><Altitude v={altMin} /></div>
          </div>
          <div className='row align-items-center my-3'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'In ICAO standard conditions', id: 'icao_std' })}&nbsp;</div>
            <div className='col-4'><Altitude v={altStd} /></div>
          </div>
          <div className='row align-items-center my-3'>
            <div className='col-8'>{intl.formatMessage({ defaultMessage: 'During a summer heat wave', id: 'heat_wave' })}&nbsp;({Pmax} hPa, {Tmax}°C)</div>
            <div className='col-4'><Altitude v={altMax} /></div>
          </div>
          <div className='row align-items-center'>
            <hr />
          </div>
        </div>
      </div>
    </div >
  );
};

export default FlightLevels;
