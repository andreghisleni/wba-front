/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/nursery/noNoninteractiveElementInteractions: <explanation> */
import { cn } from "@/lib/utils";

export function ActionsDiv({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  function stopPropagation(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.stopPropagation();
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        className
      )}
      onDoubleClick={stopPropagation}
      {...props}
    />
  );
}
