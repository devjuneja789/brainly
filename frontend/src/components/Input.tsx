export interface Inputprops {
    placeholder: string, 
    ref?: any;
}


export const Input = (props: Inputprops) => {
    return <div><input ref={props.ref} className ="px-4 py-2 border rounded m-2" type="text" placeholder={props.placeholder}></input></div>
}