import { DeleteIcon } from "../icons/DeleteIcon"
import { DocIcon } from "../icons/DocIcon"
import { ShareIcon } from "../icons/Shareicon"




interface CardProps {
    title: string,
    link: string,
    contentType: "youtube" | "twitter"
}



export const Card = ({ title, link, contentType }: CardProps) => {
    return <div className="bg-white rounded-md shadow-md outline-1 outline-gray-200 max-w-80 ">
        <div className="flex justify-between items-center p-4">
            <div className="flex gap-2 items-center text-lg ">
                <DocIcon size="lg" />
                {title}
            </div>
            <div className="flex gap-2 text-gray-500">
                <a href={link} target="_blank"> <ShareIcon size="lg" /></a>
                <DeleteIcon size="lg" />
            </div>
        </div>
        <div className="w-80 p-0.5 px-2">
            {contentType === "youtube" && <iframe src={link.replace("watch", "embed").replace("?v=", "/")} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>}
            {contentType === "twitter" && (
                        <blockquote className="twitter-tweet">
                            <a href={link.replace("x.com", "twitter.com")}></a>
                        </blockquote>
                    )}
        </div>
    </div >
}