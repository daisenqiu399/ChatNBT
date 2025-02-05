import {Button} from '@/components/ui/button'
import { Dialog,DialogContent,DialogHeader,DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@radix-ui/react-separator'
import {api} from '@/convex/_generated/api'
import { useAction } from 'convex/react'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps{
    open:boolean;
    setOpen:(open:boolean)=>void;
}

export const UpgradeModal=({
    open,
    setOpen
}:UpgradeModalProps)=>{
    const upgrade=useAction(api.stripe.pay);
    const router=useRouter();

    const handleUpgrade=async()=>{
        const url=await upgrade({});
        if(!url) return;
        router.push(url);
    }
    return (
        <Dialog open={open} onOpenChange={(e)=>setOpen(e)}>
            <DialogContent className='bg-neutral-700  text-white border-none max-w-2xl'>
                <DialogHeader className='p-3'>
                  <DialogTitle>Upgrade your subscription</DialogTitle>
                </DialogHeader>
                <Separator className='h-[1px] bg-white/20'/> 
                <div className='flex justify-between'>
                 <div className='w-1/2 p-4 gap-y-2'>
                 <h3 className='text-lg font-semibold'>Free</h3>
                 <p className='font-thin text-white'>USD $0/month</p>
                 <Button
                 disabled
                 className='font-semibold text-xs bg-neutral-900 p-4 my-4 text-wrap rounded-md'
                 
                 >
                    
                 </Button>
                 </div>
                </div>
            </DialogContent>

        

        </Dialog>
    )
}