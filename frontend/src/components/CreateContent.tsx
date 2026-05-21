import { useRef, useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import axios from "axios";
import { Backend_Url } from "../config";

enum ContentType {
    Youtube = "youtube",
    Twitter = "twitter",
    Note = "note",
    Link = "link"
}

export const CreateContent = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const titleRef = useRef<HTMLInputElement>(null);
    const linkRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const [contentType, setType] = useState(ContentType.Youtube);

    async function addContent() {
        const title = titleRef.current?.value;
        const link = linkRef.current?.value;
        const body = bodyRef.current?.value;
        try {
            await axios.post(`${Backend_Url}/api/v1/content`, {
                title,
                link,
                body,
                contentType
            }, {
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            onClose();
        } catch (e) {
            console.error(e);  // ← what does this say?
        }
    }



    return <div>
        {open && (
            <div className="fixed top-0 left-0 h-screen w-screen flex justify-center items-center z-50">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-500 opacity-60"
                    onClick={onClose}
                />
                {/* Modal - sits above backdrop */}
                <div className="relative bg-white p-4 rounded-md z-10 w-[420px] max-w-[92vw]">
                    <div className="flex justify-end">
                        <div onClick={onClose} className="cursor-pointer hover:bg-slate-200">
                            <CrossIcon size="lg" />
                        </div>
                    </div>
                    <div>
                        <Input ref={titleRef} placeholder="Title" />
                        {contentType !== ContentType.Note && <Input ref={linkRef} placeholder="Link" />}
                        <textarea
                            ref={bodyRef}
                            className="px-4 py-2 border rounded m-2 w-[calc(100%-1rem)] min-h-28 resize-y"
                            placeholder={contentType === ContentType.Note ? "Write your note" : "Optional notes about this save"}
                        />
                    </div>
                    <div className="flex justify-center gap-2 p-2 flex-wrap">
                        <Button text="Youtube" variant={contentType === ContentType.Youtube ? "primary" : "secondary"} onClick={() => setType(ContentType.Youtube)} />
                        <Button text="Twitter" variant={contentType === ContentType.Twitter ? "primary" : "secondary"} onClick={() => setType(ContentType.Twitter)} />
                        <Button text="Note" variant={contentType === ContentType.Note ? "primary" : "secondary"} onClick={() => setType(ContentType.Note)} />
                        <Button text="Link" variant={contentType === ContentType.Link ? "primary" : "secondary"} onClick={() => setType(ContentType.Link)} />
                    </div>
                    <div className="flex justify-center">
                        <Button onClick={addContent} variant="primary" text="submit" />
                    </div>
                </div>
            </div>
        )}
    </div>
};

