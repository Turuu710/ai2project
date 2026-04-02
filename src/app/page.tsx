"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ArticleForm from "@/components/ArticleForm";
import { toast } from "sonner";

interface Quiz {
  id: string;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  createdAt: string;
  quizzes?: Quiz[];
}

export default function Home() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [articleLoading, setArticleLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const router = useRouter();

  const saveLockRef = useRef(false);
  const quizLockRef = useRef(false);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Fetch articles error:", data);
        setArticles([]);
        return;
      }

      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]);
      toast.error("Нийтлэлүүд ачаалахад алдаа гарлаа");
    } finally {
      setArticleLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!content.trim()) {
      toast.error("Текстээ оруулна уу");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "summary",
          title: title.trim() || "Гарчиггүй",
          text: content.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Summary error:", data);
        toast.error(data?.error || "Summary үүсгэхэд алдаа гарлаа");
        return;
      }

      if (!data?.summary) {
        console.error("No summary:", data);
        toast.error("Summary ирсэнгүй");
        return;
      }

      setSummary(data.summary);
      toast.success("Summary амжилттай үүслээ!");
    } catch (error) {
      console.error("Generate summary error:", error);
      toast.error("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    if (saveLockRef.current || savingArticle) return;

    if (!title.trim()) {
      toast.error("Гарчиг оруулна уу");
      return;
    }

    if (!content.trim()) {
      toast.error("Article content хоосон байна");
      return;
    }

    if (!summary?.trim()) {
      toast.error("Эхлээд Summary үүсгэнэ үү");
      return;
    }

    saveLockRef.current = true;
    setSavingArticle(true);

    try {
      const saveResponse = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          summary: summary.trim(),
          quizzes: [],
        }),
      });

      const result = await saveResponse.json().catch(() => null);

      if (!saveResponse.ok) {
        toast.error(result?.error || "Хадгалахад алдаа гарлаа");
        return;
      }

      toast.success("Article амжилттай хадгалагдлаа!");
      await fetchArticles();

      setTitle("");
      setContent("");
      setSummary(null);
    } catch (error) {
      console.error("Save article error:", error);
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      saveLockRef.current = false;
      setSavingArticle(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!content.trim()) {
      toast.error("Текст хоосон байна");
      return;
    }

    if (!summary?.trim()) {
      toast.error("Эхлээд Summary үүсгэнэ үү");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "quiz",
          title:
            title.trim() ||
            content.trim().substring(0, 50) +
              (content.trim().length > 50 ? "..." : ""),
          text: content.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Generate quiz failed:", result);
        toast.error(result?.error || "Quiz үүсгэхэд алдаа гарлаа");
        return;
      }

      if (!result?.id) {
        console.error("Quiz result has no id:", result);
        toast.error("Quiz үүссэн ч article id ирсэнгүй");
        return;
      }

      toast.success("Quiz амжилттай үүслээ");
      router.push(`/quiz/${result.id}`);
    } catch (error) {
      console.error("Generate quiz error:", error);
      toast.error("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar articles={articles} loading={articleLoading} />

      <main className="flex-1 min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <ArticleForm
            title={title}
            content={content}
            summary={summary}
            loading={loading || savingArticle || generatingQuiz}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onGenerateSummary={handleGenerateSummary}
            onSaveArticle={handleSaveArticle}
            onGenerateQuiz={handleGenerateQuiz}
          />
        </div>
      </main>
    </div>
  );
}
