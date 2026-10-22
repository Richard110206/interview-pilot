import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type {
  AuthFormData,
  AuthMode,
} from "@/hooks/auth/useAuthPageController";

type AuthFormCardProps = {
  mode: AuthMode;
  formData: AuthFormData;
  errorMessage: string;
  isSubmitting: boolean;
  onSwitchMode: (mode: AuthMode) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

export default function AuthFormCard({
  mode,
  formData,
  errorMessage,
  isSubmitting,
  onSwitchMode,
  onInputChange,
  onSubmit,
}: AuthFormCardProps) {
  const isLogin = mode === "login";

  return (
    <Card className="p-8">
      <div className="grid grid-cols-2 border-b border-border">
        {(
          [
            ["login", "登录"],
            ["register", "注册"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onSwitchMode(value)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm transition-colors",
              mode === value
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="auth-username" className="text-sm font-medium">
            用户名
          </label>
          <Input
            id="auth-username"
            name="username"
            placeholder="输入你的用户名"
            value={formData.username}
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="auth-password" className="text-sm font-medium">
            密码
          </label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            placeholder="输入密码"
            value={formData.password}
            onChange={onInputChange}
          />
        </div>
        {!isLogin && (
          <div className="space-y-1.5">
            <label
              htmlFor="auth-confirm-password"
              className="text-sm font-medium"
            >
              确认密码
            </label>
            <Input
              id="auth-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={onInputChange}
            />
          </div>
        )}

        {errorMessage && (
          <div className="text-sm text-destructive">{errorMessage}</div>
        )}
      </div>

      <Button
        className="mt-6 w-full"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLogin ? "登录进入" : "注册并开始"}
      </Button>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>登录即代表同意服务条款与隐私政策</span>
        <Link
          to={ROUTES.home}
          className="transition-colors hover:text-foreground"
        >
          返回首页
        </Link>
      </div>
    </Card>
  );
}
