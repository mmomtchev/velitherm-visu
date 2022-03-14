import React from 'react';
import { useIntl } from 'react-intl';

import Slider from './Slider';
import { ReactComponent as Plus } from '../icons/plus.svg';
import { ReactComponent as Minus } from '../icons/minus.svg';

import * as velitherm from 'velitherm';

const maxAlt = 3000;
const steps = 50;
const info = 10;

// Compute the adiabatic expansion from the pressure ratio
//
// Adiabatic expansion is governed by the Ideal gas law
// P * V = n * R * T
// where P=pressure, V=volume, n=molar quantity, R=ideal gas constant, T=temperature
// Additionally adiabatic expansion is an isentropic process (constant entropy), which gives:
// V = V0 * (P / P0) ^ (-1 / Gamma) where Gamma is the heat capacity ratio
// Air is mostly a diatomic gas, so Gamma is 1.4
//
// Refer to https://en.wikipedia.org/wiki/Ideal_gas_law
// (this is not true during condensation)

function adiabaticExpanion(pressure: number, pressure0: number, volume0: number): number {
    return volume0 * Math.pow(pressure / pressure0, -1 / 1.4);
}

function tempToColor(tempMin: number, tempMax: number, t: number, invert?: boolean): [number, number, number] {
    let red = 1.0, green = 1.0, blue = 1.0;
    const dv = tempMax - tempMin;

    t = Math.max(Math.min(t, tempMax), tempMin);

    if (invert)
        t = tempMax - (t - tempMin);

    if (t < (tempMin + 0.25 * dv)) {
        red = 0;
        green = 4 * (t - tempMin) / dv;
    } else if (t < (tempMin + 0.5 * dv)) {
        red = 0;
        blue = 1 + 4 * (tempMin + 0.25 * dv - t) / dv;
    } else if (t < (tempMin + 0.75 * dv)) {
        red = 4 * (t - tempMin - 0.5 * dv) / dv;
        blue = 0;
    } else {
        green = 1 + 4 * (tempMin + 0.75 * dv - t) / dv;
        blue = 0;
    }

    return [red, green, blue];
}

function colorString(rgb: [number, number, number]): string {
    return '#' + rgb.map(c => Math.round(c * 192).toString(16).padStart(2, '0')).join('');
}

interface LevelUI {
    altitude: number;
    temperature: number;
    rh: number;
}

interface Level extends LevelUI {
    q: number;
    density: number;
    volume?: number;
}

function interpolateLevel(altitude: number, lvls: Level[]): Level {
    for (let i = 0; i < lvls.length - 1; i++) {
        if (altitude >= lvls[i].altitude && altitude <= lvls[i + 1].altitude) {
            const c = (altitude - lvls[i].altitude) / (lvls[i + 1].altitude - lvls[i].altitude);
            const temperature = lvls[i].temperature + c * (lvls[i + 1].temperature - lvls[i].temperature);
            const q = lvls[i].q + c * (lvls[i + 1].q - lvls[i].q);
            const p = velitherm.pressureFromStandardAltitude(altitude);
            const p0 = velitherm.pressureFromStandardAltitude(lvls[i].altitude);
            const rh = velitherm.relativeHumidity(q, p, temperature);
            const density = velitherm.airDensity(rh, p, temperature);
            const volume = lvls[i].volume !== undefined ? adiabaticExpanion(p, p0, lvls[i].volume) : undefined;
            return {
                altitude,
                temperature,
                q,
                rh,
                density,
                volume
            };
        }
    }
    throw new RangeError('out of range ' + altitude);
}

function centerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.fillText(text, x - text.length * 4 - 10, y);
}

function drawInfo(ctx, lvls: Level[], x: number, width: number, height: number): void {
    for (let i = 0; i < info; i++) {
        const altitude = (i + 0.5) * maxAlt / info;

        if (altitude > lvls[lvls.length - 1].altitude)
            continue;

        const y = height - (i + 0.5) * height / info;

        const lvl = interpolateLevel(altitude, lvls);

        const volume = lvl.volume ?? 1;

        let line = y - 25;
        ctx.beginPath();
        if (lvl.rh < 100)
            ctx.fillStyle = 'white';
        else
            ctx.fillStyle = 'grey';
        ctx.arc(x - 5, y, width / 8 * volume, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'blue';
        centerText(ctx, `${Math.min(lvl.rh, 100).toFixed(0)}%`, x, line);
        line += 20;

        ctx.fillStyle = 'black';
        centerText(ctx, `${lvl.density.toFixed(3)}kg/m³`, x, line);
        line += 20;

        ctx.fillStyle = 'red';
        centerText(ctx, `${lvl.temperature.toFixed(2)}°C`, x, line);
        line += 20;

        ctx.fillStyle = 'black';
        centerText(ctx, `${altitude}m`, x, line);
        line += 20;
    }
}

function computeAtmosphericProfile(lvls: LevelUI[]): Level[] {
    lvls.sort((a, b) => a.altitude - b.altitude);
    const atmoProfile: Level[] = [];
    for (const lvl of lvls) {
        if (lvl.altitude == null || lvl.temperature == null)
            continue;
        const p = velitherm.pressureFromStandardAltitude(lvl.altitude);
        const q = velitherm.specificHumidity(lvl.rh, p, lvl.temperature);
        const l: Level = {
            ...lvl,
            q,
            density: velitherm.airDensity(lvl.rh, p, lvl.temperature)
        };
        atmoProfile.push(l);
    }
    return atmoProfile;
}

function computeUpdraftProfile(lvls: Level[], deltaT: number): Level[] {
    const updraftProfile: Level[] = [{
        altitude: 0,
        temperature: lvls[0].temperature + deltaT,
        q: lvls[0].q,
        rh: lvls[0].rh,
        density: velitherm.airDensity(lvls[0].rh, velitherm.P0, lvls[0].temperature),
        volume: 1
    }];
    for (let i = 1; i < steps; i++) {
        const altitude = i / (steps - 1) * maxAlt;
        const p = velitherm.pressureFromStandardAltitude(altitude);
        const p0 = velitherm.pressureFromStandardAltitude(updraftProfile[i - 1].altitude);
        const rh = velitherm.relativeHumidity(updraftProfile[i - 1].q, p, updraftProfile[i - 1].temperature);
        const temperature = updraftProfile[i - 1].temperature - (maxAlt / (steps - 1)) *
            (rh < 100 ?
                velitherm.gamma :
                velitherm.gammaMoist(updraftProfile[i - 1].temperature, p));
        const volume = adiabaticExpanion(p, p0, updraftProfile[i - 1].volume);
        const l: Level = {
            altitude,
            temperature,
            q: updraftProfile[i - 1].q,
            rh,
            density: velitherm.airDensity(rh, p, temperature),
            volume
        };
        if (l.density > interpolateLevel(altitude, lvls).density)
            break;
        updraftProfile.push(l);
    }

    return updraftProfile;
}

const Thermal = () => {
    const [deltaT, setDeltaT] = React.useState(0.5);
    const [levels, setLevels] = React.useState<LevelUI[]>([
        {
            altitude: 0,
            temperature: 25,
            rh: 70
        },
        {
            altitude: maxAlt,
            temperature: 0,
            rh: 10
        }
    ]);


    const canvas = React.useRef<HTMLCanvasElement>();

    const tempMin = levels.reduce((min, lvl) => lvl.temperature < min ? lvl.temperature : min, Infinity);
    const tempMax = levels.reduce((max, lvl) => lvl.temperature > max ? lvl.temperature : max, -Infinity) + deltaT;

    const atmoProfile = computeAtmosphericProfile(levels);

    const updraftProfile = computeUpdraftProfile(atmoProfile, deltaT);

    React.useEffect(() => {
        const ctx = canvas.current.getContext('2d');
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        ctx.font = '18px sans-serif';

        const tempProfile = ctx.createLinearGradient(0, height - 1, 0, 0);
        const humidProfile = ctx.createLinearGradient(0, height - 1, 0, 0);
        for (let i = 0; i < steps; i++) {
            tempProfile.addColorStop(i / steps,
                colorString(tempToColor(tempMin, tempMax,
                    (interpolateLevel(i / steps * maxAlt, atmoProfile).temperature))));
            humidProfile.addColorStop(i / steps,
                colorString(tempToColor(0, 100,
                    (interpolateLevel(i / steps * maxAlt, atmoProfile).rh), true)));
        }

        ctx.fillStyle = humidProfile;
        ctx.fillRect(0, 0, width / 2, height);
        ctx.fillStyle = tempProfile;
        ctx.fillRect(width / 2, 0, width / 2, height);

        const updraftHeight = (updraftProfile[updraftProfile.length - 1].altitude / maxAlt) * height;
        const updraftTempProfile = ctx.createLinearGradient(0, height - 1, 0, height - updraftHeight);
        const updraftHumidProfile = ctx.createLinearGradient(0, height - 1, 0, height - updraftHeight);
        if (updraftProfile.length > 1) {
            for (let i = 0; i < updraftProfile.length; i++) {
                updraftTempProfile.addColorStop(i / (updraftProfile.length - 1),
                    colorString(tempToColor(tempMin, tempMax, updraftProfile[i].temperature)));
                updraftHumidProfile.addColorStop(i / (updraftProfile.length - 1),
                    colorString(tempToColor(0, 100, updraftProfile[i].rh, true)));
            }
            ctx.fillStyle = updraftHumidProfile;
            ctx.fillRect(width / 3 - width / 20, height - updraftHeight, width / 10, updraftHeight);
            ctx.fillStyle = updraftTempProfile;
            ctx.fillRect(width * 2 / 3 - width / 20, height - updraftHeight, width / 10, updraftHeight);
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, height - updraftHeight, width, 1);

        drawInfo(ctx, atmoProfile, width / 8, width, height);
        drawInfo(ctx, updraftProfile, width * 7 / 8, width, height);
    });

    const intl = useIntl();
    return (
        <React.Fragment><div className='m-2'>
            <div className='d-flex flex-row'>
                <div className='level-margin'>&nbsp;
                </div>
                <div>
                    <div className='canvas-width d-flex flex-row justify-content-around'>
                        <div>
                            {intl.formatMessage({ defaultMessage: 'Humidity', id: 'CzyxVf' })}
                        </div>
                        <div>
                            {intl.formatMessage({ defaultMessage: 'Temperature', id: 'cG0Q8M' })}
                        </div>
                    </div>
                    <div className='canvas-width d-flex flex-row justify-content-between'>
                        <div>
                            {intl.formatMessage({ defaultMessage: 'Atmosphere', id: 'wfBz/D' })}
                        </div>
                        <div>
                            {intl.formatMessage({ defaultMessage: 'Updraft', id: 'u2kBiA' })}
                        </div>
                    </div>
                </div>
            </div>
            <div className='position-relative d-flex flex-row'>
                <div className='level-margin'>
                    {
                        levels.map((lvl, i) => {
                            const y = lvl.altitude / maxAlt;
                            let plusAlt: number = undefined;
                            if (i > 0)
                                plusAlt = (levels[i - 1].altitude + lvl.altitude) / 2;
                            return (<React.Fragment key={lvl.altitude}>
                                <div className='level-label d-flex flex-row justify-content-between flex-wrap'
                                    style={{ position: 'absolute', top: `calc(80vh * (1 - ${y}) - 1rem)` }}>
                                    <div>
                                        <input type='number' className='input-number' id={`temp-${lvl.altitude}`}
                                            min={-40} max={40} maxLength={3} step={0.5}
                                            value={lvl.temperature.toFixed(1)} onChange={(ev) => {
                                                lvl.temperature = +ev.target.value;
                                                setLevels([...levels]);
                                            }} />
                                        <label htmlFor={`temp-${lvl.altitude}`}>°C</label>
                                    </div>
                                    <div>
                                        <input type='number' className='input-number' id={`humid-${lvl.altitude}`}
                                            min={0} max={100} maxLength={3} step={1} value={lvl.rh.toFixed(0)}
                                            onChange={(ev) => {
                                                lvl.rh = +ev.target.value;
                                                setLevels([...levels]);
                                            }} />
                                        <label htmlFor={`humid-${lvl.altitude}`}>%</label>
                                    </div>
                                    <div className='fw-bold'>{lvl.altitude}m</div>
                                    {i > 0 && i < levels.length - 1 ?
                                        <button className='btn m-0 p-0' onClick={() => {
                                            return;
                                        }}>
                                            <Minus className='button-icon' onClick={() => {
                                                const i = levels.findIndex((l) => l.altitude === lvl.altitude);
                                                levels.splice(i, 1);
                                                setLevels([...levels]);
                                            }} />
                                        </button>
                                        :
                                        <span className='button-icon'></span>
                                    }
                                </div>
                                {i > 0 ?
                                    <div className='level-label d-flex flex-row justify-content-end'
                                        style={{ position: 'absolute', top: `calc(80vh * (1 - ${plusAlt / maxAlt}) - 1rem)` }}>
                                        <button className='btn m-0 p-0' onClick={() => {
                                            const def = interpolateLevel(plusAlt, atmoProfile);
                                            setLevels([...levels, {
                                                altitude: plusAlt,
                                                rh: def.rh,
                                                temperature: def.temperature
                                            }]);
                                        }}>
                                            <Plus className='button-icon' />
                                        </button>
                                    </div>
                                    : null
                                }
                            </React.Fragment>);
                        })
                    }
                </div>
                <canvas className='vertical-profile' ref={canvas} width='400px' height='1200px' />
            </div>
        </div>
            <div className='my-4'>&nbsp;</div>
            <Slider title={intl.formatMessage({ defaultMessage: 'Updraft Intensity ΔT', id: 'GBBT7J' })}
                units='°C' value={deltaT} min={0} max={1} step={0.1} scale={1} onChange={(v) => setDeltaT(v)} />
        </React.Fragment>
    );
};

export default Thermal;
