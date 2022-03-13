import React from 'react';

import * as velitherm from 'velitherm';

const maxAlt = 3000;
const steps = 50;
const info = 10;

function tempToColor(tempMin: number, tempMax: number, t: number): [number, number, number] {
    let red = 1.0, green = 1.0, blue = 1.0;
    const dv = tempMax - tempMin;

    t = Math.max(Math.min(t, tempMax), tempMin);

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

interface LevelBase {
    altitude: number;
    temperature: number;
    rh: number;
}

interface Level extends LevelBase {
    q: number;
    density: number;
}

function interpolateLevel(altitude: number, lvls: Level[]): Level {
    for (let i = 0; i < lvls.length - 1; i++) {
        if (altitude >= lvls[i].altitude && altitude <= lvls[i + 1].altitude) {
            const c = (altitude - lvls[i].altitude) / (lvls[i + 1].altitude - lvls[i].altitude);
            const temperature = lvls[i].temperature + c * (lvls[i + 1].temperature - lvls[i].temperature);
            const q = lvls[i].q + c * (lvls[i + 1].q - lvls[i].q);
            const p = velitherm.pressureFromStandardAltitude(altitude);
            const rh = velitherm.relativeHumidity(q, p, temperature);
            const density = velitherm.airDensity(rh, p, temperature);
            return {
                altitude,
                temperature,
                q,
                rh,
                density
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

        let line = y - 25;
        ctx.beginPath();
        if (lvl.rh < 100)
            ctx.fillStyle = 'white';
        else
            ctx.fillStyle = 'grey';
        ctx.arc(x - 5, y, width / 8, 0, 2 * Math.PI);
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

function computeAtmosphericProfile(lvls: LevelBase[]): Level[] {
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

function computeupdraftProfileProfile(lvls: Level[], deltaT: number): Level[] {
    const updraftProfile: Level[] = [{
        altitude: 0,
        temperature: lvls[0].temperature + deltaT,
        q: lvls[0].q,
        rh: lvls[0].rh,
        density: velitherm.airDensity(lvls[0].rh, velitherm.P0, lvls[0].temperature)
    }];
    for (let i = 1; i < steps; i++) {
        const altitude = i / (steps - 1) * maxAlt;
        const p = velitherm.pressureFromStandardAltitude(altitude);
        const rh = velitherm.relativeHumidity(updraftProfile[i - 1].q, p, updraftProfile[i - 1].temperature);
        const temperature = updraftProfile[i - 1].temperature - (maxAlt / (steps - 1)) *
            (rh < 100 ?
                velitherm.gamma :
                velitherm.gammaMoist(updraftProfile[i - 1].temperature, p));
        const l: Level = {
            altitude,
            temperature,
            q: updraftProfile[i - 1].q,
            rh,
            density: velitherm.airDensity(rh, p, temperature)
        };
        if (l.density > interpolateLevel(altitude, lvls).density)
            break;
        updraftProfile.push(l);
    }

    return updraftProfile;
}

const Thermal = () => {
    const [deltaT, setDeltaT] = React.useState(0.5);
    const [levels, setLevels] = React.useState<LevelBase[]>([
        {
            altitude: 0,
            temperature: 25,
            rh: 50
        },
        {
            altitude: maxAlt / 6,
            temperature: 18,
            rh: 40
        },
        {
            altitude: maxAlt / 3,
            temperature: 15,
            rh: 30
        },
        {
            altitude: maxAlt / 2,
            temperature: 11,
            rh: 20
        },
        {
            altitude: maxAlt * 3 / 4,
            temperature: 9,
            rh: 20
        },
        {
            altitude: maxAlt,
            temperature: 0,
            rh: 10
        }
    ]);

    const canvas = React.useRef<HTMLCanvasElement>();

    const tempMin = levels.reduce((min, lvl) => lvl.temperature < min ? lvl.temperature : min, Infinity);
    const tempMax = Math.max(levels.reduce((max, lvl) => lvl.temperature > max ? lvl.temperature : max, -Infinity),
        levels[0].temperature + deltaT);

    const toColor = (l: Level) =>
        colorString(tempToColor(tempMin, tempMax, l.temperature));

    const atmoProfile = computeAtmosphericProfile(levels);

    const updraftProfile = computeupdraftProfileProfile(atmoProfile, deltaT);

    React.useEffect(() => {
        const ctx = canvas.current.getContext('2d');
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        ctx.font = '18px sans-serif';

        const tempProfile = ctx.createLinearGradient(0, height - 1, 0, 0);
        for (let i = 0; i < steps; i++)
            tempProfile.addColorStop(i / steps, toColor(interpolateLevel(i / steps * maxAlt, atmoProfile)));
        ctx.fillStyle = tempProfile;
        ctx.fillRect(0, 0, width, height);

        const updraftHeight = (updraftProfile[updraftProfile.length - 1].altitude / maxAlt) * height;
        const updraftGradient = ctx.createLinearGradient(0, height - 1, 0, height - updraftHeight);
        if (updraftProfile.length > 1) {
            for (let i = 0; i < updraftProfile.length; i++) {
                updraftGradient.addColorStop(i / (updraftProfile.length - 1), toColor(updraftProfile[i]));
            }
            ctx.fillStyle = updraftGradient;
            ctx.fillRect(width / 2 - 15, height - updraftHeight, 30, updraftHeight);
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, height - updraftHeight, width, 1);

        drawInfo(ctx, atmoProfile, width / 4, width, height);
        drawInfo(ctx, updraftProfile, width * 3 / 4, width, height);
    });

    return (
        <div className='m-4'>
            <div style={{ position: 'relative' }} className='d-flex flex-row'>
                <div className='label2'>
                    {
                        levels.map((lvl, i) => {
                            const y = lvl.altitude / maxAlt;
                            return (<div className='level-label d-flex flex-row justify-content-between' key={lvl.altitude} style={{ position: 'absolute', top: `calc(70vh * (1 - ${y}) - 1rem)` }}>
                                <div>
                                    <input type='number' className='label05' id={`temp-${lvl.altitude}`}
                                        min={-40}
                                        max={40}
                                        value={lvl.temperature.toFixed(0)} onChange={(ev) => {
                                            lvl.temperature = +ev.target.value;
                                            setLevels([...levels]);
                                        }} />
                                    <label htmlFor={`temp-${lvl.altitude}`}>°C</label>
                                </div>
                                <div>
                                    <input type='number' className='label05' id={`humid-${lvl.altitude}`}
                                        min={0} max={100} value={lvl.rh.toFixed(0)} onChange={(ev) => {
                                            lvl.rh = +ev.target.value;
                                            setLevels([...levels]);
                                        }} />
                                    <label htmlFor={`humid-${lvl.altitude}`}>%</label>
                                </div>
                                <div className='fw-bold'>{lvl.altitude}m</div>
                            </div>);
                        })
                    }
                </div>
                <canvas className='vertical-profile' ref={canvas} width='400px' height='1200px' />
            </div>
        </div>
    );
};

export default Thermal;
