import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api"
// import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType, ChatEventType } from '@coze/api';
import OpenAI from 'openai';


// 获取消息列表，根据聊天id获取。
export const list = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db.query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .collect();
    }
})

// 执行数据库操作，将message数据插入db
export const send = internalMutation({
    args: {
        role:
            v.union(
                v.literal("user"),
                v.literal("assistant")
            ),
        content: v.string(),
        chatId: v.id("chats")
    },
    handler: async (ctx, args) => {
        const newMessageId = await ctx.db.insert("messages", {
            role: args.role,
            content: args.content,
            chatId: args.chatId
        });
        return newMessageId;
    }
})

export const retrive = internalQuery({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const messages = await ctx.db.query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .order("desc")
            .take(3);

        return messages;
    }
})

// 动作函数，首先验证用户是否存在，然后再调用send发送消息执行数据库操作。【逻辑和操作分离，提高可维护性】
export const submit = action({
    args: {
        role:
            v.union(
                v.literal("user"),
                v.literal("assistant")
            ),
        content: v.string(),
        chatId: v.id("chats")
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.runQuery(api.users.currentUser, {});
        if (currentUser === null) {
            throw new Error("User not found");
        }

        // send user message 执行数据库操作
        await ctx.runMutation(internal.messages.send, {
            role: args.role,
            content: args.content,
            chatId: args.chatId
        })

        const messages = await ctx.runQuery(internal.messages.retrive, {
            chatId: args.chatId
        })

        messages.reverse();

        const formattedMessages = messages.map(message => ({
            role: message.role,
            content: message.content
        }));

        // const cozeClient = new CozeAPI({
        //     token: process.env.COZE_API_KEY!,
        //     allowPersonalAccessTokenInBrowser: true,
        //     baseURL: COZE_CN_BASE_URL
        // });
        // try {
        //     const stream = await cozeClient.chat.stream({
        //         bot_id: process.env.COZE_BOT_ID!,
        //         additional_messages: [{
        //             role: RoleType.User,
        //             content: "hello",
        //             content_type: 'text',
        //         }],
        //     })
        //     if (!stream) {
        //         console.error('Stream is empty. There might be an issue with the API request.');
        //     } else {
        //         console.log(stream);
        //         // TODO: 目前来看应该是stream的获取有问题。无法解决。'Error in stream iteration:' [TypeError: Cannot read properties of undefined (reading 'slice')]
        //         for await (const part of stream) {
        //             console.log(part);
        //         }
        //     }
        // } catch (error) {
        //     console.error('Error while streaming from Coze API:', error);
        // }


        // 这里使用kimi的
        const openai = new OpenAI({
            apiKey: process.env.MOONSHOT_API_KEY, // 在这里将 MOONSHOT_API_KEY 替换为你从 Kimi 开放平台申请的 API Key
            baseURL: "https://api.moonshot.cn/v1",
        })

        let response = '';

        const stream = await openai.chat.completions.create({
            model: 'moonshot-v1-8k',
            stream: true,
            messages: formattedMessages,
            temperature: 0.3,
        })

        // save message from openai 
        const newAssistantMessageId = await ctx.runMutation(internal.messages.send, {
            role: "assistant",
            content: '',
            chatId: args.chatId
        });

        for await (const part of stream) {
            if (part.choices[0].delta.content === null) {
                throw Error("OpenAI completion is null");
            }

            if (part.choices[0].delta.content !== undefined) {
                response += part.choices[0].delta.content;
                await ctx.runMutation(internal.messages.update, {
                    messageId: newAssistantMessageId,
                    content: response
                })
            }
        }
    }
});

export const update = internalMutation({
    args: { messageId: v.id("messages"), content: v.string() },
    handler: async (ctx, args) => {
        // patch 局部更新
        await ctx.db.patch(args.messageId, {
            content: args.content
        })
    }
})

// export function stramCoze() {

//     const client = new CozeAPI({
//         // 注意，这里的环境变量要去convex的settings→environment variables里面设置
//         token: 'pat_eOoDIbM0528MHAmwjEVozuMzF0zh8yplKcfZa6igQzlqO3lRdI46u0Cp3gDaUxtD',
//         allowPersonalAccessTokenInBrowser: true,
//         baseURL: COZE_CN_BASE_URL
//     })

//     let response = '';

//     const v = await client.chat.createAndPoll({
//         // 注意，这里的环境变量要去convex的settings→environment variables里面设置
//         bot_id: '7466418282615750665',
//         additional_messages: [{
//             role: RoleType.User,
//             content: 'hello',
//             content_type: 'text'
//         }]
//     })
//     console.log('vvvvv', v);
//     // if (v.chat.status === ChatStatus.COMPLETED) {
//     //     console.log('usage', v.chat.usage);
//     // }

//     // // save message
//     // const newAssistantMessageId = await ctx.runMutation(internal.messages.send, {
//     //     role: "assistant",
//     //     content: '',
//     //     chatId: args.chatId
//     // });


//     // for await (const part of stream) {
//     //     // 当聊天会话创建成功时，打印 [START]
//     //     if (part.event === ChatEventType.CONVERSATION_CHAT_CREATED) {
//     //         console.log('[START]');
//     //     }
//     //     // 当收到新的消息片段时，将消息内容实时输出到标准输出流。
//     //     else if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
//     //         // process.stdout.write(part.data.content);
//     //         response += part.data.content;
//     //         await ctx.runMutation(internal.messages.update, {
//     //             messageId: newAssistantMessageId,
//     //             content: response
//     //         })
//     //     }
//     //     // 当一条消息发送完成时，如果消息的角色是 'assistant' 且类型是 'answer'，则在标准输出流中换行；否则，打印消息的角色、类型和内容。
//     //     else if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
//     //         const { role, type, content } = part.data;
//     //         if (role === 'assistant' && type === 'answer') {
//     //             // process.stdout.write('\n');
//     //             response += '\n'
//     //         } else {
//     //             console.log('[%s]:[%s]:%s', role, type, content);
//     //         }
//     //     }
//     //     // 当聊天会话完成时，打印聊天的使用情况信息。
//     //     else if (part.event === ChatEventType.CONVERSATION_CHAT_COMPLETED) {
//     //         console.log(part.data.usage);
//     //     }
//     //     // 当所有处理完成时，打印事件数据。
//     //     else if (part.event === ChatEventType.DONE) {
//     //         console.log(part.data);
//     //     }
//     //     // 当出现错误时，将错误信息输出到标准错误流。
//     //     else if (part.event === ChatEventType.ERROR) {
//     //         console.error(part.data);
//     //     }
//     // }
//     // console.log('=== End of Streaming Chat ===');


// }