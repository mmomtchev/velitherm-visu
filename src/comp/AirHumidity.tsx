import React from 'react';
import Slider from './Slider';
import Checkbox from './Checkbox';

import { ReactComponent as Cloud } from '../icons/cloud.svg';

import * as velitherm from 'velitherm';

type LRType = 'malr' | 'dalr' | 'auto' | 'avg' | undefined;

const SliderPage = () => {
    const [temperature, setTemperature] = React.useState(15);
    const [pressure, setPressure] = React.useState(1013);
    const [altitude, setAltitude] = React.useState(velitherm.altitudeFromStandardPressure(pressure));
    const [specificHumidity, setSpecificHumidity] = React.useState(1);
    const [mixingRatio, setMixingRatio] = React.useState(velitherm.mixingRatio(specificHumidity));
    const [relativeHumidity, setRelativeHumidity] =
        React.useState(velitherm.relativeHumidity(specificHumidity, pressure, temperature));
    const [dewPoint, setDewPoint] = React.useState(velitherm.dewPoint(relativeHumidity, temperature));
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
    };

    const fromPressure = (v) => {
        const h = velitherm.altitudeFromStandardPressure(v);
        fromAltitude(h);
    };

    const fromAltitude = (v) => {
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
        const p = velitherm.pressureFromStandardAltitude(v);
        setPressure(p);
        fromSpecificHumidity(specificHumidity, p, t);
    };

    const boilingPoint = (1 / (1 / 100 -
        velitherm.R * Math.log(pressure / velitherm.P0) / 2500));
    const density = velitherm.airDensity(relativeHumidity, pressure, temperature);

    const waterHeight = relativeHumidity / 100 * 40;
    const bottleFactor = Math.min(velitherm.specificHumidity(100, pressure, temperature), 100);
    const bottleHeight = (50 * bottleFactor / 100) + 'vh';
    const bottleWidth = (20 * bottleFactor / 100) + 'vh';

    return (
        <div className='d-flex flex-row'>
            <div>
                <Slider title='Specific Humidity' units='g/kg' value={specificHumidity}
                    min={0} scale={2} max={50} step={0.25} marker={markers.specificHumidity}
                    onChange={(v) => fromSpecificHumidity(v)} />
                <Slider title='Mixing Ratio' units='g/kg' value={mixingRatio}
                    min={0} max={50} scale={2} step={0.25} marker={markers.mixingRatio}
                    onChange={(v) => fromMixingRatio(v)} />
                <Slider title='Relative Humidity' units='%' value={relativeHumidity}
                    min={0} max={100} displayMax={100} scale={0} step={1} marker={markers.relativeHumidity}
                    onChange={(v) => fromRelativeHumidity(v)} />
                <Slider title='Dew Point' units='°C' value={dewPoint} marker={markers.dewPoint}
                    min={-50} max={50} displayMax={temperature} scale={1} step={0.5}
                    onChange={(v) => fromDewPoint(v)} />
                <Slider title='Temperature' units='°C' value={temperature} marker={markers.temperature}
                    min={-20} max={40} scale={1} step={0.5}
                    onChange={(v) => fromTemperature(v)} />
                <Slider title='Pressure' units='hPa' value={pressure} marker={markers.pressure}
                    min={velitherm.pressureFromStandardAltitude(maxAlt)} max={velitherm.P0} scale={0} step={5}
                    onChange={(v) => fromPressure(v)} />
                <Slider title='Altitude' units='m' value={altitude}
                    min={0} max={maxAlt} scale={0} step={10} marker={markers.altitude}
                    onChange={(v) => fromAltitude(v)} />
                <div className='d-flex flex-column m-4'>
                    <div>Pressure/Temperature Adiabatic Coupling</div>
                    <Checkbox<LRType> title='Dry Adiabatic Lapse Rate' id='dalr'
                        info={velitherm.gamma} value={lr} onChange={setLR} />
                    <Checkbox<LRType> title='Moist Adiabatic Lapse Rate' id='malr'
                        info={velitherm.gammaMoist(temperature, pressure)} value={lr} onChange={setLR} />
                    <Checkbox<LRType> title='Switch MALR/DALR automatically' id='auto'
                        value={lr} onChange={setLR} />
                    <Checkbox<LRType> title='Average Atmospheric Lapse Rate' id='avg'
                        info={6.5e-3} value={lr} onChange={setLR} />
                </div>
                <div className='d-flex flex-column m-4'>
                    <span>
                        Air density:
                        <strong className='ms-3'>
                            {density.toFixed(3)}kg/m&sup3;
                        </strong>
                    </span>
                </div>
                <div className='d-flex flex-column m-4'>
                    <span>
                        Boiling point of water:
                        <strong className='ms-3'>
                            {boilingPoint.toFixed(2)}°C
                        </strong>
                    </span>
                </div>
                <label className='label m-4' htmlFor='maxAlt'>Maximum altitude</label>
                <input id='maxAlt' type='number' value={maxAlt} onChange={(ev) => setMaxAlt(+ev.target.value)} />
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
                    }}>Memory</button>
                    </div>
                    {
                        markers.specificHumidity !== undefined ?
                            <div className='m-2 p-2 bg-light'>
                                <table className='label2'><tbody>
                                    <tr><td>Specific Humidity</td><td className='fw-bold'>{markers.specificHumidity.toFixed(2)}g/kg</td></tr>
                                    <tr><td>Mixing Ratio</td><td className='fw-bold'>{markers.mixingRatio.toFixed(2)}g/kg</td></tr>
                                    <tr><td>Relative Humidity</td><td className='fw-bold'>{markers.relativeHumidity.toFixed(0)}%</td></tr>
                                    <tr><td>Temperature</td><td className='fw-bold'>{markers.temperature.toFixed(1)}°C</td></tr>
                                    <tr><td>Pressure</td><td className='fw-bold'>{markers.pressure.toFixed(0)}hPa</td></tr>
                                    <tr><td>Altitude</td><td className='fw-bold'>{markers.altitude.toFixed(0)}m</td></tr>
                                    <tr><td>Density</td><td className='fw-bold'>{markers.density.toFixed(3)}kg/m&sup3;</td></tr>
                                </tbody></table>
                            </div>
                            : null
                    }
                </div>
            </div>
            <div className='water-container w-100 d-flex align-items-center'>
                {
                    relativeHumidity >= 100 ?
                        <Cloud className='cloud' /> : null
                }
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
            </div>
        </div >
    );
};

export default SliderPage;
