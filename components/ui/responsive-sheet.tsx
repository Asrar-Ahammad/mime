"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
  Sheet as SheetPrimitive,
  SheetTrigger as SheetTriggerPrimitive,
  SheetClose as SheetClosePrimitive,
  SheetContent as SheetContentPrimitive,
  SheetHeader as SheetHeaderPrimitive,
  SheetFooter as SheetFooterPrimitive,
  SheetTitle as SheetTitlePrimitive,
  SheetDescription as SheetDescriptionPrimitive,
} from "@/components/ui/sheet"
import {
  Drawer as DrawerPrimitive,
  DrawerTrigger as DrawerTriggerPrimitive,
  DrawerClose as DrawerClosePrimitive,
  DrawerContent as DrawerContentPrimitive,
  DrawerHeader as DrawerHeaderPrimitive,
  DrawerFooter as DrawerFooterPrimitive,
  DrawerTitle as DrawerTitlePrimitive,
  DrawerDescription as DrawerDescriptionPrimitive,
} from "@/components/ui/drawer"

export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)")
}

const ResponsiveSheetContext = React.createContext<boolean>(true)

export function Sheet(props: React.ComponentProps<typeof SheetPrimitive>) {
  const isDesktop = useIsDesktop()
  return (
    <ResponsiveSheetContext.Provider value={isDesktop}>
      {isDesktop ? <SheetPrimitive {...props} /> : <DrawerPrimitive {...props} />}
    </ResponsiveSheetContext.Provider>
  )
}

export function SheetTrigger(props: React.ComponentProps<typeof SheetTriggerPrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetTriggerPrimitive {...props} />
  return <DrawerTriggerPrimitive {...props} />
}

export function SheetClose(props: React.ComponentProps<typeof SheetClosePrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetClosePrimitive {...props} />
  return <DrawerClosePrimitive {...props} />
}

export function SheetContent({ side, className, ...props }: React.ComponentProps<typeof SheetContentPrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetContentPrimitive side={side} className={className} {...props} />
  
  const mobileClassName = className?.replace("overflow-y-auto", "") || ""

  return (
    <DrawerContentPrimitive className={cn("h-fit max-h-[85vh] p-0 flex flex-col w-full overflow-hidden", mobileClassName)} {...props}>
      <div className="px-4 pb-6 pt-2 overflow-y-auto overflow-x-hidden w-full flex-1 min-h-0">
        {props.children}
      </div>
    </DrawerContentPrimitive>
  )
}

export function SheetHeader(props: React.ComponentProps<typeof SheetHeaderPrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetHeaderPrimitive {...props} />
  return <DrawerHeaderPrimitive className="text-left" {...props} />
}

export function SheetFooter(props: React.ComponentProps<typeof SheetFooterPrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetFooterPrimitive {...props} />
  return <DrawerFooterPrimitive className="px-0" {...props} />
}

export function SheetTitle(props: React.ComponentProps<typeof SheetTitlePrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetTitlePrimitive {...props} />
  return <DrawerTitlePrimitive {...props} />
}

export function SheetDescription(props: React.ComponentProps<typeof SheetDescriptionPrimitive>) {
  const isDesktop = React.useContext(ResponsiveSheetContext)
  if (isDesktop) return <SheetDescriptionPrimitive {...props} />
  return <DrawerDescriptionPrimitive {...props} />
}
