import React from 'react';

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
    return (
        <div className='d-flex flex-row m-2'>
            <label className='label m-2' htmlFor={id}>{props.title}</label>
            <input type='range' className='slider' id={id} value={valueSlider} min={props.min} max={props.max} step={props.step} onChange={(ev) => {
                props.onChange(+ev.target.value);
            }} />
            <p className='units m-2'>
                {isNaN(valueText) ? valueText : valueText.toFixed(props.scale)}
                {props.units}</p>
        </div>

    );
}

export default Slider;