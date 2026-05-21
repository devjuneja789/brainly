import axios from "axios";
import { useState } from "react";
import { Backend_Url } from "../config";
import { Button } from "./Button";

type Source = {
    title: string;
    link?: string;
    similarity: number;
};

export function BrainChat() {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function askBrain() {
        if (!question.trim()) {
            return;
        }

        setLoading(true);
        setError("");
        setAnswer("");
        setSources([]);

        try {
            const response = await axios.post(`${Backend_Url}/api/v1/brain/chat`, {
                question
            }, {
                headers: {
                    "authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            setAnswer(response.data.answer);
            setSources(response.data.sources || []);
        } catch (e) {
            setError("Brain chat is not ready yet. Check your AI and pgvector setup.");
        } finally {
            setLoading(false);
        }
    }

    return <section className="bg-white outline-1 outline-gray-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
            <div>
                <h2 className="text-xl font-semibold">Ask your brain</h2>
                <p className="text-sm text-gray-500">Chat with your saved notes, links, tweets, and videos.</p>
            </div>
            <Button onClick={askBrain} variant="primary" text={loading ? "Thinking..." : "Ask"} />
        </div>
        <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full min-h-24 border rounded-md px-4 py-3 resize-y"
            placeholder="What do I know about..."
        />
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {answer && <div className="mt-4">
            <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
            {sources.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
                {sources.map((source, index) => (
                    <a
                        key={`${source.title}-${index}`}
                        href={source.link}
                        target="_blank"
                        className="text-sm bg-blue-400 text-blue-700 px-3 py-1 rounded-md max-w-60 truncate"
                    >
                        {source.title}
                    </a>
                ))}
            </div>}
        </div>}
    </section>
}
