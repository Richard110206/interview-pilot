import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";

type SendButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
  title?: string;
};

export default function SendButton({
  onClick,
  disabled,
  loading,
  variant = "primary",
  className,
  title,
}: SendButtonProps) {
  const baseClass =
    variant === "ghost"
      ? "h-9 w-9"
      : "h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <Button
      size="icon"
      variant={variant === "ghost" ? "ghost" : "default"}
      className={cn(baseClass, className)}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      title={title}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
    </Button>
  );
}
