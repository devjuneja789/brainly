import type { ReactElement } from "react";

export interface Buttonprops {
    variant: "primary" | "secondary";
    text: string;
    startIcon?: ReactElement;
    onClick?: () => void;
}

const defaultStyles = "rounded-md px-4 py-2 flex items-center gap-2 cursor-pointer";

const variantStyles = {
    "primary": "bg-blue-700 text-white",
    "secondary": "bg-blue-400 text-blue-700"
}


export const Button = (props: Buttonprops) => {
    return <button onClick={props.onClick} className={`${variantStyles[props.variant]} ${defaultStyles}`}>{props.startIcon}{props.text}</button>
}
