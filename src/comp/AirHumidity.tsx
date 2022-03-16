import React from 'react';
import { useIntl } from 'react-intl';

import Slider from './Slider';
import Checkbox from './Checkbox';
import { ReactComponent as Cloud } from '../icons/cloud.svg';

import * as velitherm from 'velitherm';

type LRType = 'malr' | 'dalr' | 'auto' | 'avg' | undefined;

const foot = 3.28084;

const AirHumidity = () => {
    const intl = useIntl();

    const [qnh, setQNH] = React.useState<'qnh' | 'qff'>('qnh');
    const [temperature, setTemperature] = React.useState(velitherm.T0);
    const [pressure, setPressure] = React.useState(velitherm.P0);
    const [altitude, setAltitude] = React.useState(velitherm.altitudeFromStandardPressure(pressure));
    const [specificHumidity, setSpecificHumidity] = React.useState(1);
    const [mixingRatio, setMixingRatio] = React.useState(velitherm.mixingRatio(specificHumidity));
    const [relativeHumidity, setRelativeHumidity] =
        React.useState(velitherm.relativeHumidity(specificHumidity, pressure, temperature));
    const [dewPoint, setDewPoint] = React.useState(velitherm.dewPoint(relativeHumidity, temperature));
    const [groundTemp, setGroundTemp] = React.useState(velitherm.T0);
    const [MSLPressure, setMSLPressure] = React.useState(velitherm.P0);
    const [lr, setLR] = React.useState<LRType>(undefined);
    const [maxAlt, setMaxAlt] = React.useState(6000);
    const [markers, setMarkers] = React.useState({
        temperature: undefined,
        pressure: undefined,
        altitude: undefined,
        specificHumidity: undefined,
        mixingRatio: undefined,
        relativeHumidity: undefined,
        dewPoint: undefined,
        density: undefined
    });

    const fromSpecificHumidity = (v, p?: number, t?: number) => {
        setSpecificHumidity(v);
        setMixingRatio(velitherm.mixingRatio(v));
        const rh = velitherm.relativeHumidity(v, p ?? pressure, t ?? temperature);
        setRelativeHumidity(rh);
        setDewPoint(velitherm.dewPoint(rh, t ?? temperature));
    };

    const fromMixingRatio = (v) => {
        setMixingRatio(v);
        const q = velitherm.specificHumidityFromMixingRatio(v);
        fromSpecificHumidity(q);
    };

    const fromRelativeHumidity = (v) => {
        setRelativeHumidity(v);
        const q = velitherm.specificHumidity(v, pressure, temperature);
        fromSpecificHumidity(q);
    };

    const fromDewPoint = (v) => {
        setDewPoint(v);
        const q =
            velitherm.specificHumidity(velitherm.relativeHumidityFromDewPoint(v, temperature), pressure, temperature);
        fromSpecificHumidity(q);
    };

    const fromTemperature = (v) => {
        setTemperature(v);
        fromSpecificHumidity(specificHumidity, pressure, v);
        if (qnh === 'qff')
            setAltitude(velitherm.altitudeFromPressure(pressure, MSLPressure, (groundTemp + v) /2));
    };

    const fromPressure = (v: number, p0: number = MSLPressure, t0: number = groundTemp) => {
        const h = qnh === 'qnh' ?
            velitherm.altitudeFromStandardPressure(v) :
            velitherm.altitudeFromPressure(v, p0, (t0 + temperature) / 2);
        fromAltitude(h);
    };

    const fromAltitude = (v: number, p0: number = MSLPressure, t0: number = groundTemp) => {
        let t = temperature;
        if (lr !== undefined) {
            // integrate over the altitude at 10m increments
            const d = v < altitude ? -10 : +10;
            for (let a = altitude; (d < 0 && a > v) || (d > 0 && a < v); a += d) {
                const p = velitherm.pressureFromStandardAltitude(a);
                const rh = velitherm.relativeHumidity(specificHumidity, p, t);
                if (lr === 'malr' || (lr === 'auto' && rh >= 100)) {
                    t -= d * velitherm.gammaMoist(t, p);
                }
                if (lr === 'dalr' || (lr === 'auto' && rh < 100)) {
                    t -= d * velitherm.gamma;
                }
                if (lr === 'avg') {
                    t -= d * 6.5e-3;
                }
            }
        }
        if (t != temperature) setTemperature(t);
        setAltitude(v);
        const p = qnh === 'qnh' ?
            velitherm.pressureFromStandardAltitude(v) :
            velitherm.pressureFromAltitude(v, p0, (t0 + temperature) / 2);
        setPressure(p);
        fromSpecificHumidity(specificHumidity, p, t);
    };

    const fromGroundTemp = (v) => {
        setGroundTemp(v);
        fromPressure(pressure, MSLPressure, v);
    };

    const fromMSLPressure = (v) => {
        setMSLPressure(v);
        fromPressure(pressure, v, groundTemp);
    };

    const boilingPoint = (1 / (1 / 100 -
        velitherm.R * Math.log(pressure / velitherm.P0) / 2500));
    const density = velitherm.airDensity(relativeHumidity, pressure, temperature);

    const waterHeight = relativeHumidity / 100 * 40;
    const bottleFactor = Math.min(velitherm.specificHumidity(100, pressure, temperature), 100);
    const bottleHeight = (50 * bottleFactor / 100) + 'vh';
    const bottleWidth = (20 * bottleFactor / 100) + 'vh';

    const flightLevel = velitherm.altitudeFromStandardPressure(pressure) * foot / 100;

    return (
        <div className='d-flex flex-row'>
            <div>
                <div className='border shadow m-1 d-flex flex-row'>
                    <div className='d-flex flex-column m-4 w-100'>
                        <div>
                            <input id='qnh' type='radio' radioGroup='qnh-qff' checked={qnh === 'qnh'} onChange={() => setQNH('qnh')} />
                            <label className='m-0 mx-1' htmlFor='qnh'>{intl.formatMessage({ defaultMessage: 'QNH (ICAO Standard Atmosphere)', id: 'MUrmtQ' })}</label>
                        </div>
                        <div>
                            <input id='qff' type='radio' radioGroup='qnh-qff' checked={qnh === 'qff'} onChange={() => setQNH('qff')} />
                            <label className='m-0 mx-1' htmlFor='qff'>{intl.formatMessage({ defaultMessage: 'QFF (Real Atmosphere)', id: 'lOlN1B' })}</label>
                        </div>
                    </div>
                    <div className='w-100'>
                        <label className='label m-4' htmlFor='maxAlt'>{intl.formatMessage({ defaultMessage: 'Maximum altitude', id: 'n2Xki0' })}</label>
                        <input id='maxAlt' className='label05' type='number' value={maxAlt} onChange={(ev) => setMaxAlt(+ev.target.value)} />
                    </div>
                </div>
                <div className='border shadow m-1 my-3'>
                    <Slider title={intl.formatMessage({ defaultMessage: 'Specific Humidity', id: '1Il19w' })} units='g/kg' value={specificHumidity}
                        min={0} scale={2} max={50} step={0.25} marker={markers.specificHumidity}
                        onChange={(v) => fromSpecificHumidity(v)} />
                    <Slider title={intl.formatMessage({ defaultMessage: 'Mixing Ratio', id: 'xMPM/i' })} units='g/kg' value={mixingRatio}
                        min={0} max={50} scale={2} step={0.25} marker={markers.mixingRatio}
                        onChange={(v) => fromMixingRatio(v)} />
                    <Slider title={intl.formatMessage({ defaultMessage: 'Relative Humidity', id: '7QFtvL' })} units='%' value={relativeHumidity}
                        min={0} max={100} displayMax={100} scale={0} step={1} marker={markers.relativeHumidity}
                        onChange={(v) => fromRelativeHumidity(v)} />
                    <Slider title={intl.formatMessage({ defaultMessage: 'Dew Point', id: 'A+iO8C' })} units='°C' value={dewPoint} marker={markers.dewPoint}
                        min={-50} max={50} displayMax={temperature} scale={1} step={0.5}
                        onChange={(v) => fromDewPoint(v)} />
                    <Slider title={intl.formatMessage({ defaultMessage: 'Temperature', id: 'cG0Q8M' })} units='°C' value={temperature} marker={markers.temperature}
                        min={-40} max={40} scale={1} step={0.5}
                        onChange={(v) => fromTemperature(v)} />
                </div>
                <div className='border shadow m-1 my-3'>
                    <Slider title={intl.formatMessage({ defaultMessage: 'Pressure', id: 'NGVQvj' })} units='hPa' value={pressure} marker={markers.pressure}
                        min={velitherm.pressureFromStandardAltitude(maxAlt)} max={velitherm.P0 + 20} scale={0} step={5}
                        onChange={(v) => fromPressure(v)} />
                    <Slider title={intl.formatMessage({ defaultMessage: 'Altitude', id: '5YsvtF' })} units='m' value={altitude}
                        min={0} max={maxAlt} scale={0} step={10} marker={markers.altitude}
                        onChange={(v) => fromAltitude(v)} />
                </div>
                {
                    qnh === 'qff' ?
                        <div className='border shadow m-1 my-3'>
                            <Slider title={intl.formatMessage({ defaultMessage: 'Ground Temperature', id: 'oB8QmG' })} units='°C' value={groundTemp}
                                min={-20} max={40} scale={0} step={1}
                                onChange={(v) => fromGroundTemp(v)} />
                            <Slider title={intl.formatMessage({ defaultMessage: 'MSL Pressure', id: 'Cuavgr' })} units='hPa' value={MSLPressure}
                                min={velitherm.P0 - 50}
                                max={velitherm.P0 + 50} scale={0} step={1}
                                onChange={(v) => fromMSLPressure(v)} />
                        </div>
                        : null
                }
                <div className='border shadow p-1 m-1 my-3 d-flex flex-column'>
                    <div>{intl.formatMessage({ defaultMessage: 'Pressure/Temperature Adiabatic Coupling', id: 'VUfOxx' })}</div>
                    <Checkbox<LRType> title={intl.formatMessage({ defaultMessage: 'Dry Adiabatic Lapse Rate', id: 'LcfKc7' })} id='dalr'
                        info={velitherm.gamma} value={lr} onChange={setLR} />
                    <Checkbox<LRType> title={intl.formatMessage({ defaultMessage: 'Moist Adiabatic Lapse Rate', id: '9SCokE' })} id='malr'
                        info={velitherm.gammaMoist(temperature, pressure)} value={lr} onChange={setLR} />
                    <Checkbox<LRType> title={intl.formatMessage({ defaultMessage: 'Switch MALR/DALR automatically', id: 'AGPiqI' })} id='auto'
                        value={lr} onChange={setLR} />
                    <Checkbox<LRType> title={intl.formatMessage({ defaultMessage: 'Average Atmospheric Lapse Rate', id: 'O3Y5BR' })} id='avg'
                        info={6.5e-3} value={lr} onChange={setLR} />
                </div>
                <div className='border shadow p-1 m-1 my-3 d-flex flex-row justify-content-around'>
                    <span>
                        {intl.formatMessage({ defaultMessage: 'Air Density:', id: 'xgnCrJ' })}
                        <strong className='ms-3'>
                            {density.toFixed(3)}kg/m&sup3;
                        </strong>
                    </span>
                    <span>
                        {intl.formatMessage({ defaultMessage: 'Flight Level:', id: 'c2gMjQ' })}
                        <strong className='ms-3'>
                            {flightLevel.toFixed(0)}
                        </strong>
                    </span>
                    <span>
                        {intl.formatMessage({ defaultMessage: 'Boiling Point of Water:', id: 'c8qwja' })}
                        <strong className='ms-3'>
                            {boilingPoint.toFixed(2)}°C
                        </strong>
                    </span>
                </div>
                <div className='d-flex flex-row m-4'>
                    <div className='me-4'>
                        <button className='btn btn-danger' onClick={() => {
                            setMarkers({
                                specificHumidity,
                                mixingRatio,
                                relativeHumidity,
                                dewPoint,
                                temperature,
                                pressure,
                                altitude,
                                density
                            });
                        }}>{intl.formatMessage({ defaultMessage: 'Memory', id: 'dVx3yz' })}</button>
                    </div>
                    {
                        markers.specificHumidity !== undefined ?
                            <div className='m-2 p-2 bg-light'>
                                <table className='label2'><tbody>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Specific Humidity', id: '1Il19w' })}</td><td className='fw-bold'>{markers.specificHumidity.toFixed(2)}g/kg</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Mixing Ratio', id: 'xMPM/i' })}</td><td className='fw-bold'>{markers.mixingRatio.toFixed(2)}g/kg</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Relative Humidity', id: '7QFtvL' })}</td><td className='fw-bold'>{markers.relativeHumidity.toFixed(0)}%</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Temperature', id: 'cG0Q8M' })}</td><td className='fw-bold'>{markers.temperature.toFixed(1)}°C</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Pressure', id: 'NGVQvj' })}</td><td className='fw-bold'>{markers.pressure.toFixed(0)}hPa</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Altitude', id: '5YsvtF' })}</td><td className='fw-bold'>{markers.altitude.toFixed(0)}m</td></tr>
                                    <tr><td>{intl.formatMessage({ defaultMessage: 'Density', id: 'utCd4l' })}</td><td className='fw-bold'>{markers.density.toFixed(3)}kg/m&sup3;</td></tr>
                                </tbody></table>
                            </div>
                            : null
                    }
                </div>
            </div>
            <div className='water-container w-100 d-flex align-items-center'>
                {
                    relativeHumidity >= 100 ?
                        <Cloud className='cloud' />
                        :
                        <svg className='water-bottle' width={bottleWidth} height={bottleHeight}
                            data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 21 51'>
                            <defs>
                                <mask id='water-mask'>
                                    <rect className='mask-rect' x='477' y='108' width='15' height={waterHeight}
                                        transform='rotate(-180 247.5 78.5)' fill='white' />
                                </mask>
                            </defs>
                            <path className='bottle' d='M19 21.1L15 8.74V6a2.3 2.3 0 0 0-.14-.9 1.54 1.54 0 0 0 .14-.65V3c0-.85-.35-1.5-1.19-1.5H7.86C7.02 1.5 6 2.15 6 3v1.47a1.55 1.55 0 0 0 .22.79 1.32 1.32 0 0 0-.22.76v2.72L2 21.09a12.12 12.12 0 0 0-.51 3.21v22.1a3.29 3.29 0 0 0 3.15 3.1h12a2.92 2.92 0 0 0 2.85-3.1V24.3a12.14 12.14 0 0 0-.49-3.2zM7.69 3h5.81v1.47a3.12 3.12 0 0 0 .31.08h-.08l-6-.05zM18 46.4a1.63 1.63 0 0 1-1.4 1.58H4.65C3.93 47.98 3 46.85 3 46.4V24.3a11 11 0 0 1 .61-2.73L7.72 9.1l.08-3a3.72 3.72 0 0 1 .88-.06h4.82v2.79l4.06 12.71a10.67 10.67 0 0 1 .44 2.73z'
                                fill='black' />
                            <path className='water' mask='url(#water-mask)' d='M4.5 46.5v-23l4-14h4l4 14v23' fill='blue' />
                        </svg>
                }
            </div>
        </div >
    );
};

export default AirHumidity;
