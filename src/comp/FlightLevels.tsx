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

// Environmental lapse rate as a function of pressure
// °C/hPa
//
// Integrate over the pressure in 1hPa increments
function environmentalCoolingFromPressure(P: number, P0: number, T0: number, LR: number): number {
  if (P0 <= P) throw new Error('P0 not superior to P');
  // Start with T0
  let Tp = T0;
  for (let Pp = P0 - 1; Pp > P; Pp--) {
    // For each 1hPa layer find the depth in meters
    const z = velitherm.altitudeFromPressure(Pp, Pp + 1, Tp);
    // Decrease the temperature
    Tp -= z * LR / 100;
  }
  return Tp;
}

const Altitude = (props: { v: number; }) => {
  return <div className='d-flex flex-column'>
    <strong className='text-nowrap'>{Math.round(props.v)} m</strong>
    <em className='text-nowrap'>{Math.round(props.v * velitherm.feetPerMeter)} ft</em>
  </div>;
};

const FlightLevels = () => {
  const intl = useIntl();

  const [T0, setT0] = React.useState(velitherm.T0);
  const [P0, setP0] = React.useState(velitherm.P0);
  const [FL, setFL] = React.useState(115);
  const [LR, setLR] = React.useState(velitherm.ELR * 100);
  const [P, setP] = React.useState(velitherm.pressureFromFL(FL));
  const [T, setT] = React.useState(environmentalCoolingFromPressure(P, P0, T0, LR));
  const [Tmean, setTmean] = React.useState((T0 + T) / 2);
  const [alt, setAlt] = React.useState(velitherm.altitudeFromPressure(P, P0, Tmean));
  const [altStd, setAltStd] = React.useState(velitherm.altitudeFromStandardPressure(P));
  const [altMin, setAltMin] = React.useState(velitherm.altitudeFromPressure(P, Pmin, (Tmin + environmentalCoolingFromPressure(P, P0, Tmin, LR)) / 2));
  const [altMax, setAltMax] = React.useState(velitherm.altitudeFromPressure(P, Pmax, (Tmax + environmentalCoolingFromPressure(P, P0, Tmax, LR)) / 2));

  const fromFL = (newFL: number) => {
    const newP = velitherm.pressureFromFL(newFL);
    const newT = environmentalCoolingFromPressure(newP, P0, T0, LR);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(newP, P0, newTmean);
    setFL(newFL);
    setP(newP);
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin,
      (Tmin + environmentalCoolingFromPressure(newP, P0, Tmin, LR)) / 2));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax,
      (Tmax + environmentalCoolingFromPressure(newP, P0, Tmax, LR)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
  };

  const fromPressure = (newP: number) => {
    const newT = environmentalCoolingFromPressure(newP, P0, T0, LR);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(newP, P0, newTmean);
    setP(newP);
    setFL(velitherm.FLFromPressure(newP));
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(newP, Pmin,
      (Tmin + environmentalCoolingFromPressure(newP, P0, Tmin, LR)) / 2));
    setAltMax(velitherm.altitudeFromPressure(newP, Pmax,
      (Tmax + environmentalCoolingFromPressure(newP, P0, Tmax, LR)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(newP));
  };

  const fromP0 = (newP0: number) => {
    const newT = environmentalCoolingFromPressure(P, newP0, T0, LR);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(P, newP0, newTmean);
    setP0(newP0);
    setAlt(newAlt);
    setT(newT);
    setTmean(newTmean);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin,
      (Tmin + environmentalCoolingFromPressure(P, newP0, Tmin, LR)) / 2));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax,
      (Tmax + environmentalCoolingFromPressure(P, newP0, Tmax, LR)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
  };

  const fromT0 = (newT0: number) => {
    const newT = environmentalCoolingFromPressure(P, P0, newT0, LR);
    const newTmean = (newT0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(P, P0, newTmean);
    setT0(newT0);
    setTmean(newTmean);
    setT(newT);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin,
      (Tmin + environmentalCoolingFromPressure(P, P0, Tmin, LR)) / 2));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax,
      (Tmax + environmentalCoolingFromPressure(P, P0, Tmax, LR)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
  };

  const fromLR = (newLR: number) => {
    const newT = environmentalCoolingFromPressure(P, P0, T0, newLR);
    const newTmean = (T0 + newT) / 2;
    const newAlt = velitherm.altitudeFromPressure(P, P0, newTmean);
    setLR(newLR);
    setTmean(newTmean);
    setT(newT);
    setAlt(newAlt);
    setAltMin(velitherm.altitudeFromPressure(P, Pmin,
      (Tmin + environmentalCoolingFromPressure(P, P0, Tmin, newLR)) / 2));
    setAltMax(velitherm.altitudeFromPressure(P, Pmax,
      (Tmax + environmentalCoolingFromPressure(P, P0, Tmax, newLR)) / 2));
    setAltStd(velitherm.altitudeFromStandardPressure(P));
  };

  return (
    <>
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
              <Slider title={intl.formatMessage({ defaultMessage: 'Lapse rate', id: 'lapse_rate' })}
                units='°C/100m' value={LR} marker={velitherm.gamma * 100}
                min={0.4} max={1.05} scale={2} step={0.01}
                onChange={fromLR} />
              <div className='container mt-4'>
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
      <div className='border shadow m-1 my-3 p-3'>
        <h5>{intl.formatMessage({ defaultMessage: 'Mean and maximum errors compared to actual measurements with a weather balloon', id: 'errors_label' })}</h5>
        <em className='mt-3'>{intl.formatMessage({ defaultMessage: 'Brest, Aug 2025, stable maritime atmosphere in anticyclonic conditions', id: 'brest' })}</em>
        <table className='table table-striped table-light'>
          <thead>
            <tr>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'For levels', id: 'for_levels' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Static ICAO standard atmosphere equation', id: 'err_std' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Barometric equation compensated for the MSL pressure of the day', id: 'err_baro' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Hypsometric equation (this method) with fixed MSL temperature = 15°C', id: 'err_hypso' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Hypsometric equation (this method) with actual MSL temperatire', id: 'err_best' })}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td> &lt; 500 m </td>
              <td> 85 m / 169 m </td>
              <td> 5 m / 18 m </td>
              <td> 4 m / 16 m </td>
              <td> 1 m / 3 m </td>
            </tr>
            <tr><td> &lt; 1000 m </td>
              <td> 94 m / 175 m </td>
              <td> 13 m / 43 m </td>
              <td> 9 m / 33 m </td>
              <td> 3 m / 10 m </td>
            </tr>
            <tr><td> &lt; 1500 m </td>
              <td> 114 m / 198 m </td>
              <td> 26 m / 70 m </td>
              <td> 15 m / 48 m </td>
              <td> 10 m / 44 m </td>
            </tr>
            <tr><td> &lt; 2000 m </td>
              <td> 128 m / 221 m </td>
              <td> 37 m / 97 m </td>
              <td> 18 m / 57 m </td>
              <td> 14 m / 45 m </td>
            </tr>
            <tr><td> &lt; 2500 m </td>
              <td> 143 m / 246 m </td>
              <td> 49 m / 124 m </td>
              <td> 22 m / 62 m </td>
              <td> 20 m / 45 m </td>
            </tr>
            <tr><td> &lt; 3000 m </td>
              <td> 159 m / 270 m </td>
              <td> 62 m / 153 m </td>
              <td> 26 m / 62 m </td>
              <td> 27 m / 53 m </td>
            </tr>
            <tr><td> &lt; 4000 m </td>
              <td> 203 m / 314 m </td>
              <td> 88 m / 204 m </td>
              <td> 55 m / 91 m </td>
              <td> 43 m / 76 m </td>
            </tr>
          </tbody>
        </table>
        <em className='mt-3'>{intl.formatMessage({ defaultMessage: 'Trappes, Aug 2025, convective atmosphere over plains in anticyclonic conditions', id: 'trappes' })}</em>
        <table className='table table-striped table-light'>
          <thead>
            <tr>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'For levels', id: 'for_levels' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Static ICAO standard atmosphere equation', id: 'err_std' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Barometric equation compensated for the MSL pressure of the day', id: 'err_baro' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Hypsometric equation (this method) with fixed MSL temperature = 15°C', id: 'err_hypso' })}</th>
              <th className='col-2'>{intl.formatMessage({ defaultMessage: 'Hypsometric equation (this method) with actual MSL temperatire', id: 'err_best' })}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td> &lt; 500 m </td>
              <td> 130 m / 437 m </td>
              <td> 4 m / 19 m </td>
              <td> 4 m / 17 m </td>
              <td> 0 m / 2 m </td>
            </tr>
            <tr><td> &lt; 1000 m </td>
              <td> 137 m / 440 m </td>
              <td> 11 m / 45 m </td>
              <td> 8 m / 37 m </td>
              <td> 1 m / 6 m </td>
            </tr>
            <tr><td> &lt; 1500 m </td>
              <td> 147 m / 442 m </td>
              <td> 19 m / 72 m </td>
              <td> 11 m / 53 m </td>
              <td> 3 m / 10 m </td>
            </tr>
            <tr><td> &lt; 2000 m </td>
              <td> 159 m / 444 m </td>
              <td> 29 m / 98 m </td>
              <td> 15 m / 62 m </td>
              <td> 4 m / 12 m </td>
            </tr>
            <tr><td> &lt; 2500 m </td>
              <td> 173 m / 446 m </td>
              <td> 39 m / 125 m </td>
              <td> 17 m / 66 m </td>
              <td> 6 m / 16 m </td>
            </tr>
            <tr><td> &lt; 3000 m </td>
              <td> 188 m / 448 m </td>
              <td> 51 m / 150 m </td>
              <td> 20 m / 66 m </td>
              <td> 9 m / 23 m </td>
            </tr>
            <tr><td> &lt; 4000 m </td>
              <td> 221 m / 450 m </td>
              <td> 76 m / 194 m </td>
              <td> 40 m / 98 m </td>
              <td> 18 m / 44 m </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default FlightLevels;
