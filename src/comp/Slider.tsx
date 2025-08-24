import React from 'react';
import Repeatable from 'react-repeatable';

import Plus from '../icons/plus.svg?react';
import Minus from '../icons/minus.svg?react';

interface SliderProps {
    title: string;
    units: string;
    value: number;
    min: number;
    max: number;
    step: number;
    scale: number;
    displayMax?: number;
    marker?: number;
    prefix?: boolean;
    onChange: (v: number) => void;
}

const RepeatableButton = ({ onClick, ...props }) => (
    <Repeatable
        tag='button'
        type='button'
        className='btn'
        onHold={onClick}
        onRelease={onClick}
        repeatDelay={500}
        repeatInterval={32}
        {...props}
    />
);

const Slider = (props: SliderProps) => {
    const id = props.title.toLowerCase().replace(/ /g, '_');
    const valueSlider = isNaN(props.value) ? props.min : props.value;
    let valueText = props.value;
    if (props.displayMax !== undefined && valueText > props.displayMax)
        valueText = props.displayMax;
    const clamp = (v: number) => Math.max(Math.min(v, props.max), props.min);

    const slider = React.useRef<HTMLInputElement>(null);
    const marker = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        if (marker.current) {
            const width = slider.current!.clientWidth - 18;
            const offset = (props.marker! - props.min) / (props.max - props.min) * width;
            marker.current.style.left = Math.max(Math.min(offset, width), 0) + 'px';
        }
    });

    return (
        <React.Fragment>
            <div className='d-flex flex-row m-2'>
                <label className='label m-2' htmlFor={id}>{props.title}</label>
                <RepeatableButton onClick={() => props.onChange(clamp(valueSlider - props.step))}>
                    <Minus className='button-icon' />
                </RepeatableButton>
                <div className='marker-container'>
                    {props.marker !== undefined ?
                        <div className='marker' style={{ left: '0' }} ref={marker}>&#9650;</div> :
                        null}
                </div>
                <input type='range' className='slider' id={id} value={valueSlider} ref={slider}
                    min={props.min} max={props.max} step={props.step} onChange={(ev) => {
                        props.onChange(+ev.target.value);
                    }} />
                <RepeatableButton onClick={() => props.onChange(clamp(valueSlider + props.step))}>
                    <Plus className='button-icon' />
                </RepeatableButton>
                <p className='units m-2 text-nowrap'>
                    <strong>
                        {!!props.prefix && props.units + ' '}
                        {isNaN(valueText) ? valueText : valueText.toFixed(props.scale)}
                        {!props.prefix && ' ' + props.units}
                    </strong>
                </p>
            </div>
        </React.Fragment>
    );
};

export default Slider;
