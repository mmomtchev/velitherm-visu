import React from 'react';

interface Props<T> {
    title: string;
    id: T;
    value: T;
    info?: number;
    onChange: (v: T | undefined) => void
}

const Checkbox = <T extends (string | undefined)>(props: Props<T>) => {
    return (
        <div className='d-flex flex-row'>
            <label className='label2' htmlFor={props.id}>{props.title}</label>
            <strong className='label ms-3'>
                {props.info ? (props.info * 100).toFixed(3) + '°C/100m' : null}
            </strong>
            <input className='m-1' id={props.title} type='checkbox' checked={props.value === props.id} onChange={((ev) => {
                if (ev.target.checked) props.onChange(props.id);
                else props.onChange(undefined);
            })} />
        </div>
    );
};

export default Checkbox;
