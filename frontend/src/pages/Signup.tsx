import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";
import { Backend_Url } from "../config";
import { useNavigate } from "react-router-dom";

export function Signup() {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const navigate = useNavigate(); 

    async function signup() {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        setError("");

        try {
            await axios.post(`${Backend_Url}/api/v1/signup`, {
                username,
                password
            })
            navigate("/signin")
        } catch (e) {
            if (axios.isAxiosError(e)) {
                setError(e.response?.data?.message || "Signup failed. Please try again.");
                return;
            }

            setError("Signup failed. Please try again.");
        }
        
    }
    return <div className="h-screen w-screen bg-gray-200 flex
justify-center items-center">

        <div className="bg-white rounded border min-w-48 p-8">
            <Input ref={usernameRef} placeholder="Username" />
            <Input ref={passwordRef} placeholder="Password" type="password" />
            {error && <p className="text-sm text-red-500 px-2 pt-2">{error}</p>}
            <div className="flex justify-center pt-4 ">
                <Button onClick={signup} variant="primary" text="Signup" />
            </div>
        </div>
    </div>
}
