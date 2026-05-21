import { useEffect, useState } from "react";
import axios from "axios";
import { Backend_Url } from "../config";

type Content = {
    _id: string;
    title: string;
    link?: string;
    body?: string;
    contentType: "youtube" | "twitter" | "note" | "link";
};

export function useContent() {
    const [contents, setContents] = useState<Content[]>([]);

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
