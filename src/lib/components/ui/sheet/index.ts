import { Dialog as DialogPrimitive } from 'bits-ui';
import Content from './sheet-content.svelte';

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;
const Portal = DialogPrimitive.Portal;

export {
	Root as Sheet,
	Trigger as SheetTrigger,
	Close as SheetClose,
	Portal as SheetPortal,
	Content as SheetContent,
	Root,
	Trigger,
	Close,
	Portal,
	Content
};
