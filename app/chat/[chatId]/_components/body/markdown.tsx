import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import copy from "copy-to-clipboard";
import { Clipboard } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
// import { gruvboxDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import {  atomOneLight } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { useState } from 'react';


interface IProps {
    content: string;
}

export default function Markdown({ content }: IProps) {
    const [buttonText,setButtonText]=useState('Copy')
    const handleCopy = (text: string) => {
        setButtonText('Copied')
        setTimeout(()=>{
         setButtonText('Copy')
        },1000)
        copy(text);
        toast.success("Copied to clipboard;");
    }

    return (
        <ReactMarkdown
            components={{
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                        <div>
                            <div className='flex w-full justify-end bg-white/5 p-2 rounded-t-md'>
                                <button onClick={() => handleCopy(String(children).replace(/\n$/, ''))}
                                className='flex items-center gap-x-2 text-black/70 bg-neutral-100 px-3 py-1 rounded hover:scale-105'
                                    >
                                    <Clipboard className='w-4 h-4' />
                                    <p className='font-sans text-sm'>{buttonText}</p>
                                </button>
                            </div>
                            <SyntaxHighlighter
                            
                                language={match[1]}
                                style={atomOneLight}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    )
                },
            }}
        >{content}</ReactMarkdown>
    )
}