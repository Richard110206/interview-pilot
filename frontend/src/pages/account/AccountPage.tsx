import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import service from "@/lib/request";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateCurrentProfile } from "@/store/slices/userSlice";

const empty = { realName: "", phone: "", mail: "" };

export default function AccountPage() {
  const username = useAppSelector((state) => state.user.currentUser?.username);
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState(empty);
  const [saved, setSaved] = useState(empty);
  const [role, setRole] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    authService
      .getProfile()
      .then((user) => {
        if (!active) return;
        const fields = {
          realName: user.realName ?? "",
          phone: user.phone ?? "",
          mail: user.mail ?? "",
        };
        setProfile(fields);
        setSaved(fields);
        setLoaded(true);
        dispatch(updateCurrentProfile({ username: user.username, ...fields }));
      })
      .catch((error: unknown) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : "账号资料加载失败，请重试。",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    service
      .get<{ isAdmin: boolean }>("/xunzhi/v1/users/is-admin")
      .then((result) => {
        if (active) setRole(result.isAdmin);
      })
      .catch(() => {
        if (active) setRole(null);
      });
    return () => {
      active = false;
    };
  }, [username, dispatch, attempt]);

  const dirty = Object.keys(empty).some(
    (key) =>
      profile[key as keyof typeof empty] !== saved[key as keyof typeof empty],
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dirty || loading || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await authService.updateProfile(profile);
      const user = await authService.getProfile();
      const fields = {
        realName: user.realName ?? "",
        phone: user.phone ?? "",
        mail: user.mail ?? "",
      };
      setProfile(fields);
      setSaved(fields);
      dispatch(updateCurrentProfile({ username: user.username, ...fields }));
      setNotice("账号资料已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="library-page h-full overflow-y-auto">
      <div className="library-shell mx-auto max-w-6xl">
        <header className="page-heading">
          <h1 className="app-title">管理账号</h1>
          <p className="app-subtitle mt-2">
            维护你的基本资料，让每一次练习都有自己的归属。
          </p>
        </header>
        <div className="account-workbench">
          <section
            className="account-form-panel"
            aria-labelledby="profile-heading"
          >
            <h2 id="profile-heading">
              <UserRound size={18} /> 基本资料
            </h2>
            {loading ? (
              <p
                className="flex items-center gap-2 py-8 text-sm text-muted-foreground"
                role="status"
              >
                <Loader2 className="animate-spin" size={16} />
                正在读取账号资料…
              </p>
            ) : loaded ? (
              <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="account-username">用户名</Label>
                  <Input
                    id="account-username"
                    value={username ?? ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    用户名用于登录，不能在这里修改。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-name">姓名</Label>
                  <Input
                    id="account-name"
                    autoComplete="name"
                    maxLength={64}
                    value={profile.realName}
                    disabled={saving}
                    onChange={(event) => {
                      setProfile({ ...profile, realName: event.target.value });
                      setNotice("");
                    }}
                    placeholder="选填"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-phone">手机号</Label>
                  <Input
                    id="account-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={32}
                    value={profile.phone}
                    disabled={saving}
                    onChange={(event) => {
                      setProfile({ ...profile, phone: event.target.value });
                      setNotice("");
                    }}
                    placeholder="选填"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-mail">邮箱</Label>
                  <Input
                    id="account-mail"
                    type="email"
                    autoComplete="email"
                    maxLength={128}
                    value={profile.mail}
                    disabled={saving}
                    onChange={(event) => {
                      setProfile({ ...profile, mail: event.target.value });
                      setNotice("");
                    }}
                    placeholder="选填"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t pt-5">
                  <Button disabled={saving || !dirty}>
                    {saving ? "保存中…" : "保存资料"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving || !dirty}
                    onClick={() => {
                      setProfile(saved);
                      setError("");
                      setNotice("");
                    }}
                  >
                    重置修改
                  </Button>
                </div>
              </form>
            ) : null}
            {error && (
              <div className="mt-4 text-sm text-destructive" role="alert">
                {error}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setAttempt(attempt + 1)}
                >
                  重新读取
                </Button>
              </div>
            )}
            {notice && (
              <p className="mt-4 text-sm text-primary" role="status">
                {notice}
              </p>
            )}
          </section>
          <aside className="account-identity-panel">
            <ShieldCheck size={24} />
            <h2>你的练习空间</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {username}
            </p>
            <span className="mt-4 inline-block rounded-lg bg-white/80 px-3 py-2 text-sm text-primary">
              {role === null ? "身份暂不可用" : role ? "管理员" : "普通账号"}
            </span>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              修改资料后，你的题目、面试记录和复盘报告会继续保留。
            </p>
            <img
              src="/brand/knowledge-lines.webp"
              alt=""
              className="mt-4 w-full"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
