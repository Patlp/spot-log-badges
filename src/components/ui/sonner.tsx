
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:text-foreground group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100",
          error: 
            "group-[.toast]:!bg-destructive group-[.toast]:!text-destructive-foreground group-[.toast]:!border-destructive",
          warning: 
            "group-[.toast]:!bg-yellow-50 group-[.toast]:!text-yellow-800 group-[.toast]:!border-yellow-500 dark:group-[.toast]:!bg-yellow-900 dark:group-[.toast]:!text-yellow-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
