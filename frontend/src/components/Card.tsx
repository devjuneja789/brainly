import { DeleteIcon } from "../icons/DeleteIcon"
import { DocIcon } from "../icons/DocIcon"
import { ShareIcon } from "../icons/Shareicon"




interface CardProps {
    title: string,
    link?: string,
    body?: string,
    contentType: "youtube" | "twitter" | "note" | "link"
}



export const Card = ({ title, link, body, contentType }: CardProps) => {
    return <div className="bg-white rounded-md shadow-md outline-1 outline-gray-200 w-80 ">
        <div className="flex justify-between items-center p-4">
            <div className="flex gap-2 items-center text-lg min-w-0">
                <DocIcon size="lg" />
                <span className="truncate">{title}</span>
            </div>
            <div className="flex gap-2 text-gray-500">
                {link && <a href={link} target="_blank"> <ShareIcon size="lg" /></a>}
                <DeleteIcon size="lg" />
            </div>
        </div>
        <div className="w-80 p-0.5 px-2 pb-4">
            {contentType === "youtube" && link && <iframe className="w-full aspect-video" src={link.replace("watch", "embed").replace("?v=", "/")} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>}
            {contentType === "twitter" && (
                        <blockquote className="twitter-tweet">
                            {link && <a href={link.replace("x.com", "twitter.com")}></a>}
                        </blockquote>
                    )}
            {contentType === "note" && <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">{body}</p>}
            {contentType === "link" && <div className="text-sm text-gray-600">
                {body && <p className="mb-3 line-clamp-5">{body}</p>}
                {link && <a className="text-blue-700 break-all" href={link} target="_blank">{link}</a>}
            </div>}
        </div>
    </div >
}
