import AuthMarketingPanel from "@/components/auth/AuthMarketingPanel";
import AuthFormCard from "@/components/auth/AuthFormCard";
import { useAuthPageController } from "@/hooks/auth/useAuthPageController";

export default function AuthPage() {
  const {
    mode,
    formData,
    loading,
    error,
    registerLoading,
    localError,
    switchMode,
    handleInputChange,
    handleSubmit,
  } = useAuthPageController();

  return (
    <div className="auth-page relative flex h-full w-full items-center justify-center overflow-y-auto bg-secondary/30 px-6 py-10">
      <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthMarketingPanel />
        <AuthFormCard
          mode={mode}
          formData={formData}
          errorMessage={error || localError}
          isSubmitting={loading || registerLoading}
          onSwitchMode={switchMode}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
