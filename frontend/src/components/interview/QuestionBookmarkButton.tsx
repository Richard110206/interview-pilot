import { Bookmark } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learningService } from "@/services/learningService";
export default function QuestionBookmarkButton({
  id,
  question,
}: {
  id: number;
  question: string;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["learning-bank-favorites"],
    queryFn: () => learningService.items("favorite"),
    staleTime: 30000,
  });
  const saved = query.data?.find((item) => item.question === question);
  const mutation = useMutation({
    mutationFn: () =>
      saved
        ? learningService.favorite(saved.id, false)
        : learningService.favoriteBank(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["learning-bank-favorites"] });
      await client.invalidateQueries({ queryKey: ["learning-items"] });
    },
  });
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        disabled={mutation.isPending || query.isLoading}
        onClick={() => mutation.mutate()}
        className="inline-flex min-h-8 items-center gap-1 text-xs text-primary"
      >
        <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
        {mutation.isPending ? "保存中…" : saved ? "已收藏" : "收藏练习"}
      </button>
      {mutation.error && (
        <span role="alert" className="text-xs text-destructive">
          {mutation.error.message}
        </span>
      )}
    </span>
  );
}
