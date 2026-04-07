import { Bicon } from "../icons/Bicon";
import { Tweet } from "../icons/Tweet";
import { Video } from "../icons/Video";
export function Sidebar() {
    return <div className="h-screen w-72 outline-1 outline-gray-100 bg-white">
        <div className="flex justify-left gap-2 items-center h-16">
            <Bicon />
            <div className="font-semibold text-xl">
                Second Brain
            </div>
        </div>
        <div className="p-4 text-gray-500 text-lg  ">
            <div className="flex gap-3 p-2">
                <Tweet />
                Tweets
            </div>
            <div className="flex gap-3 p-2">
                <Video />
                Videos
            </div><div className="flex gap-3 p-2">
                <Tweet />
                Documents
            </div>
            <div className="flex gap-3 p-2">
                <Video />
                Links
            </div>
            <div className="flex gap-3 p-2">
                <Tweet />
                Tags
            </div>
        </div>
    </div>
}