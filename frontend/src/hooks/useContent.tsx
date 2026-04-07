import { useEffect, useState } from "react";
import axios from "axios";
import { Backend_Url } from "../config";

export function useContent() {
    const [contents, setContents] = useState([]);

    useEffect(() => {
        axios.get(`${Backend_Url}/api/v1/content`,{
            headers: {
                "authorization": `Bearer ${localStorage.getItem("token")}`
            }   
        })
            .then(response => {
                setContents(response.data.content);
            })
    }, [])
    return contents;
}