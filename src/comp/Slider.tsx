import React from 'react';

import { ReactComponent as Plus } from '../icons/plus.svg';
import { ReactComponent as Minus } from '../icons/minus.svg';

interface SliderProps {
    title: string;
    units: string;
    value: number;
    min: number;
    max: number;
    step: number;
    scale: number;
    displayMax?: number;
    onChange: (v: number) => void;
}

const Slider = (props: SliderProps) => {
    const id = props.title.toLowerCase().replace(/ /g, '_');
    const valueSlider = isNaN(props.value) ? props.min : props.value;
    let valueText = props.value;
    if (props.displayMax !== undefined && valueText > props.displayMax)
        valueText = props.displayMax;
    const clamp = (v: number) => Math.max(Math.min(v, props.max), props.min);
    return (
        <div className='d-flex flex-row m-2'>
            <label className='label m-2' htmlFor={id}>{props.title}</label>
            <button className='btn' onClick={() => props.onChange(clamp(valueSlider - props.step))}>
                <Minus className='button-icon' />
            </button>
            <input type='range' className='slider' id={id} value={valueSlider}
                min={props.min} max={props.max} step={props.step} onChange={(ev) => {
                props.onChange(+ev.target.value);
            }} />
            <button className='btn' onClick={() => props.onChange(clamp(valueSlider + props.step))}>
                <Plus className='button-icon' />
            </button>
            <p className='units m-2'>
                {isNaN(valueText) ? valueText : valueText.toFixed(props.scale)}
                {props.units}</p>
        </div>

    );
};

export default Slider;