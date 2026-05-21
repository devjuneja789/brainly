import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CreateContent } from "../components/CreateContent";
import { PlusIcon } from "../icons/Plusicon";
import { ShareIcon } from "../icons/Shareicon";
import "../index.css"
import { Sidebar } from "../components/Sidebar";
import { useContent } from "../hooks/useContent";
import axios from "axios";
import { Backend_Url } from "../config";
import { BrainChat } from "../components/BrainChat";


function Dashboard() {
    const [Modal, setModel] = useState(false);
    const contents = useContent();
    return (
        <div className="flex">
            <Sidebar />
            <div className="p-4 w-full">
                <CreateContent open={Modal} onClose={() => setModel(false)} />
                <div className="flex justify-end gap-4 ">
                    <Button onClick={() => setModel(true)} startIcon={<PlusIcon size="lg" />} variant="primary" text="Add Content" />
                    <Button onClick={async () => {
                        const response = await axios.post(`${Backend_Url}/api/v1/brain/share`,
                            {
                                share: true
                            } ,{
                            headers: {
                                "authorization": `Bearer ${localStorage.getItem("token")}`
                            }
                        })
                        const shareUrl = `http://localhost:5173/share${response.data.link}`;
                        alert(shareUrl);
                    }} startIcon={<ShareIcon size="lg" />} variant="secondary" text="Share Brain" />
                </div>
                <BrainChat />
                <div className="flex gap-4 flex-wrap">
                    {contents.map(({ contentType, link, title, body, _id }) => <Card key={_id} title={title} contentType={contentType} link={link} body={body} />)}
                    {/* <Card title="Bimal Elaichi" type="twitter" link="https://x.com/giffmana/status/2038694526370345081?s=20" />
                    <Card title="Bimal Elaichi" type="youtube" link="https://www.youtube.com/watch?v=YwtvQ23_-34" /> */}
                </div>
            </div>
        </div>
    )
}
export default Dashboard
