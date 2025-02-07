import { ChatList } from "./chat-list";
import { NewChatButton } from "./new-chat-button";
import { UpgradePlanButton } from "./upgrade-plan-button";

export const Sidebar = () => {
    return (
        <div className="h-full hidden lg:flex lg:flex-col lg:w-[300px] border-white/20 p-4  bg-neutral-50" >
            <NewChatButton />
            <ChatList />
            <UpgradePlanButton />
        </div>
    );
};