/// <reference path="../types/speech-recognition.d.ts" />

import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Phone,
  Video,
  VideoOff,
  Mic,
  Plus,
  ArrowUp,
  Camera,
  Image as ImageIcon,
  Film,
  X,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";
import sofiaCallVideo from "../../1.mp4?url";
import { useProactiveSofia } from "@/lib/use-proactive-sofia";
import {
  getProfile,
  getSession,
  effectiveDifficulty,
} from "@/lib/user-store";
import { askSpark } from "@/lib/spark-client";
import {
  getStoredMessages,
  saveStoredMessages,
  refreshStats,
  setSessionStart,
  clearContactChat,
  type ChatMode,
} from "@/lib/chat-store";
import type { ChatMessage } from "@/lib/chat-types";
import {
  getContactDisplayName,
  getContactInfo,
  getContactRemark,
  setContactRemark,
} from "@/lib/contacts";
import {
  formatDateDivider,
  formatMessageTime,
  shouldShowDateDivider,
} from "@/lib/chat-time";
import { extractAndSaveMemories } from "@/lib/memory-client";
import { getRelevantMemories } from "@/lib/memory-store";
import { transcribeBlob } from "@/lib/iat-client";
import {
  pickMediaRecorderMimeType,
  speakText,
} from "@/lib/speech";
import {
  ALL_EXAM_TOPICS,
  examTopicShortLabel,
  getExamTopicById,
  pickRandomExamTopic,
} from "@/lib/exam-topics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  clearSessionExamTopic,
  examKindForTopics,
  examTopicLabel,
  getSessionExamTopic,
  setSessionExamTopic,
  type ExamTopic,
} from "@/lib/exam-context";
import { addSpeakingSession } from "@/lib/speaking-session-store";
import { compressImageFile } from "@/lib/image-utils";

export const Route = createFileRoute("/chat/$contactId")({
  head: () => ({ meta: [{ title: "Chat" }] }),
  component: ChatPage,
});

interface Msg {
  id: string;
  role: "user" | "sofia";
  text?: string;
  audioMs?: number;
  fromVoice?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  ts: number;
}

function toUiMessages(stored: ChatMessage[]): Msg[] {
  return stored
    .filter((m) => m.content !== "(conversation start)")
    .map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "sofia" : "user",
      text: m.content,
      fromVoice: m.inputSource === "voice",
      imageUrl: m.imageDataUrl,
      ts: m.timestamp,
    }));
}

function toStoredMessages(msgs: Msg[]): ChatMessage[] {
  return msgs.map((m) => ({
    id: m.id,
    role: m.role === "sofia" ? "assistant" : "user",
    content: m.text ?? (m.imageUrl ? "📷 Photo" : ""),
    timestamp: m.ts,
    inputSource: m.imageUrl ? "image" : m.fromVoice ? "voice" : "text",
    imageDataUrl: m.imageUrl?.startsWith("data:") ? m.imageUrl : undefined,
  }));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadMessagesFromStore(contactId: string, mode: ChatMode): Msg[] {
  const stored = getStoredMessages(contactId, mode);
  return stored.length > 0 ? toUiMessages(stored) : [];
}

function ChatPage() {
  const navigate = useNavigate();
  const { contactId } = useParams({ from: "/chat/$contactId" });
  const contact = getContactInfo(contactId);
  const [ready, setReady] = useState(false);
  const profile = getProfile();
  const [displayName, setDisplayName] = useState(() =>
    getContactDisplayName(contactId)
  );
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setDisplayName(getContactDisplayName(contactId));
  }, [contactId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getSession()) {
      navigate({ to: "/login" });
      return;
    }
    if (!getProfile()) {
      navigate({ to: "/onboarding" });
      return;
    }
    if (!contact) {
      navigate({ to: "/" });
      return;
    }
    setReady(true);
  }, [navigate, contact]);

  const stored = getStoredMessages(contactId, "casual");
  const [messages, setMessages] = useState<Msg[]>(() =>
    stored.length > 0 ? toUiMessages(stored) : []
  );
  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [recording, setRecording] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [cancelHint, setCancelHint] = useState(false);
  const recStartRef = useRef<number>(0);
  const startYRef = useRef(0);
  const cancelRecordingRef = useRef(false);
  const holdingRef = useRef(false);
  const cancelHintRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const greetedRef = useRef(false);
  const chatModeRef = useRef<ChatMode>("casual");
  const examTopicRef = useRef<ExamTopic | null>(null);
  const [examTopic, setExamTopic] = useState<ExamTopic | null>(null);
  const [speakingPracticeActive, setSpeakingPracticeActive] = useState(false);
  const practiceSessionStartIdxRef = useRef(0);
  const practiceSessionStartedAtRef = useRef(0);
  const practiceSessionTopicRef = useRef<ExamTopic | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((next: Msg[]) => {
    const mode = chatModeRef.current;
    const withStart = next.some((m) => m.role === "user")
      ? [
          {
            id: "start",
            role: "user" as const,
            content: "(conversation start)",
            timestamp: Date.now(),
          },
          ...toStoredMessages(next),
        ]
      : toStoredMessages(next);
    saveStoredMessages(withStart as ChatMessage[], contactId, mode);
    refreshStats(withStart as ChatMessage[], contactId, mode);
  }, [contactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!showVideoCall) return;
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => {});
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, [showVideoCall]);

  const fetchReply = useCallback(
    async (
      userText: string,
      history: ChatMessage[],
      isGreeting = false,
      imageDataUrl?: string
    ) => {
      const level = profile ? effectiveDifficulty(profile) : "intermediate";
      const examTopic = examTopicRef.current;
      return askSpark({
        text: isGreeting ? undefined : userText,
        imageDataUrl,
        history: history.map((m) => ({
          role: m.role,
          content: m.content,
          imageDataUrl: m.imageDataUrl,
        })),
        targetLanguage: "English",
        persona: "lively_friend",
        level,
        learningGoals: profile?.learningGoals ?? [],
        memories: getRelevantMemories(12),
        isGreeting,
        examTopic,
      });
    },
    [profile]
  );

  useEffect(() => {
    if (!ready || !profile || greetedRef.current) return;
    if (loadMessagesFromStore(contactId, "casual").length > 0) {
      greetedRef.current = true;
      return;
    }
    if (messages.length > 0) return;

    greetedRef.current = true;
    chatModeRef.current = "casual";
    setSessionStart(Date.now(), contactId, "casual");
    examTopicRef.current = null;
    setExamTopic(null);
    clearSessionExamTopic();

    (async () => {
      setIsLoading(true);
      try {
        const reply = await fetchReply("", [], true);
        const sofiaMsg: Msg = {
          id: generateId(),
          role: "sofia",
          text: reply,
          ts: Date.now(),
        };
        setMessages([sofiaMsg]);
        persist([sofiaMsg]);
        setIsSpeaking(true);
        await speakText(reply, "English");
        setIsSpeaking(false);
      } catch (err) {
        console.error(err);
        setErrorMsg(
          err instanceof Error ? err.message : "AI unavailable — try again"
        );
        greetedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    })();
  }, [ready, profile, messages.length, fetchReply, persist, contactId]);

  async function triggerCasualGreeting() {
    if (!profile || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const reply = await fetchReply("", [], true);
      const sofiaMsg: Msg = {
        id: generateId(),
        role: "sofia",
        text: reply,
        ts: Date.now(),
      };
      setMessages([sofiaMsg]);
      persist([sofiaMsg]);
      setIsSpeaking(true);
      await speakText(reply, "English");
      setIsSpeaking(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "AI unavailable — try again");
      greetedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }

  function openMoreSheet() {
    setRemarkDraft(getContactRemark(contactId) ?? contact?.defaultName ?? "");
    setShowMoreSheet(true);
  }

  function saveRemark() {
    if (!contact) return;
    setContactRemark(contactId, remarkDraft);
    setDisplayName(getContactDisplayName(contactId));
    setShowMoreSheet(false);
  }

  async function handleClearHistory() {
    if (isLoading) return;
    clearContactChat(contactId);
    greetedRef.current = false;
    setMessages([]);
    setShowClearConfirm(false);
    setShowMoreSheet(false);

    if (speakingPracticeActive) {
      examTopicRef.current = null;
      setExamTopic(null);
      setSpeakingPracticeActive(false);
      chatModeRef.current = "casual";
    }

    chatModeRef.current = "casual";
    setSessionStart(Date.now(), contactId, "casual");
    greetedRef.current = true;
    await triggerCasualGreeting();
  }

  const deliverSofiaReply = useCallback(
    async (reply: string, speak = true) => {
      const sofiaMsg: Msg = {
        id: generateId(),
        role: "sofia",
        text: reply,
        ts: Date.now(),
      };
      setMessages((prev) => {
        const next = [...prev, sofiaMsg];
        persist(next);
        return next;
      });
      if (speak) {
        setIsSpeaking(true);
        try {
          await speakText(reply, "English");
        } finally {
          setIsSpeaking(false);
        }
      }
    },
    [persist]
  );

  const { notifyUserReplied } = useProactiveSofia({
    contactId,
    enabled: ready && contactId === "sofia" && !speakingPracticeActive,
    speakingPracticeActive,
    messages,
    isLoading,
    isSpeaking,
    onMessage: (text) => {
      setIsLoading(true);
      setErrorMsg(null);
      void deliverSofiaReply(text)
        .catch((err) => {
          console.error(err);
          setErrorMsg(
            err instanceof Error ? err.message : "AI unavailable"
          );
        })
        .finally(() => setIsLoading(false));
    },
  });

  async function sendMessage(text: string, fromVoice = false) {
    const trimmed = text.trim();
    const imageUrl = pendingImageUrl;
    if ((!trimmed && !imageUrl) || isLoading) return;

    notifyUserReplied();

    const userMsg: Msg = {
      id: generateId(),
      role: "user",
      text: trimmed || undefined,
      fromVoice,
      imageUrl: imageUrl ?? undefined,
      ts: Date.now(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    persist(next);
    setInput("");
    setPendingImageUrl(null);
    setIsLoading(true);
    setErrorMsg(null);
    if (trimmed) void extractAndSaveMemories(trimmed);

    try {
      const history = [
        { id: "s", role: "user" as const, content: "(conversation start)", timestamp: 0 },
        ...toStoredMessages(messages),
      ] as ChatMessage[];
      const reply = await fetchReply(trimmed, history, false, imageUrl ?? undefined);
      const sofiaMsg: Msg = {
        id: generateId(),
        role: "sofia",
        text: reply,
        ts: Date.now(),
      };
      const withReply = [...next, sofiaMsg];
      setMessages(withReply);
      persist(withReply);
      setIsSpeaking(true);
      await speakText(reply, "English");
      setIsSpeaking(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : imageUrl
            ? "Could not analyze photo — try again"
            : "AI unavailable"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function sendUserText(text: string, fromVoice = false) {
    await sendMessage(text, fromVoice);
  }

  async function beginSpeakingPractice(topic?: ExamTopic) {
    if (isLoading || !profile || speakingPracticeActive) return;

    chatModeRef.current = "speaking";
    setSpeakingPracticeActive(true);

    const storedSpeaking = getStoredMessages(contactId, "speaking");
    practiceSessionStartIdxRef.current = storedSpeaking.length;
    practiceSessionStartedAtRef.current = Date.now();

    const speakingMsgs = loadMessagesFromStore(contactId, "speaking");
    setMessages(speakingMsgs);

    const picked =
      topic ??
      getSessionExamTopic() ??
      pickRandomExamTopic(examKindForTopics(profile));
    setSessionExamTopic(picked);
    examTopicRef.current = picked;
    setExamTopic(picked);
    practiceSessionTopicRef.current = picked;
    setErrorMsg(null);

    if (speakingMsgs.length > 0) return;

    setIsLoading(true);
    try {
      setSessionStart(Date.now(), contactId, "speaking");
      const reply = await fetchReply("", [], true);
      await deliverSofiaReply(reply);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "AI unavailable");
      chatModeRef.current = "casual";
      setSpeakingPracticeActive(false);
      examTopicRef.current = null;
      setExamTopic(null);
      clearSessionExamTopic();
      setMessages(loadMessagesFromStore(contactId, "casual"));
    } finally {
      setIsLoading(false);
    }
  }

  function recordSpeakingPracticeSession() {
    const topic = practiceSessionTopicRef.current;
    if (!topic) return;

    const allStored = getStoredMessages(contactId, "speaking");
    const slice = allStored
      .slice(practiceSessionStartIdxRef.current)
      .filter((m) => m.content !== "(conversation start)");
    if (slice.length === 0) return;

    const userMessageCount = slice.filter((m) => m.role === "user").length;
    addSpeakingSession({
      contactId,
      exam: topic.exam,
      examPart: topic.part,
      topicId: topic.id,
      topicTitle: topic.titleZh ?? topic.title,
      startedAt: practiceSessionStartedAtRef.current,
      endedAt: Date.now(),
      messageCount: slice.length,
      userMessageCount,
      messages: slice,
    });
  }

  async function endSpeakingPractice() {
    if (!speakingPracticeActive || isLoading || !profile) return;

    recordSpeakingPracticeSession();

    setSpeakingPracticeActive(false);
    clearSessionExamTopic();
    examTopicRef.current = null;
    setExamTopic(null);
    setErrorMsg(null);

    chatModeRef.current = "casual";
    const casualMsgs = loadMessagesFromStore(contactId, "casual");
    setMessages(casualMsgs);
    setIsLoading(true);

    try {
      const history = [
        { id: "s", role: "user" as const, content: "(conversation start)", timestamp: 0 },
        ...toStoredMessages(casualMsgs),
      ] as ChatMessage[];
      const reply = await fetchReply(
        "[Speaking practice ended — briefly wrap up and switch back to casual friend chat]",
        history,
      );
      await deliverSofiaReply(reply);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "AI unavailable");
    } finally {
      setIsLoading(false);
    }
  }

  async function switchTopic(topicId: string) {
    if (isLoading || !profile || !speakingPracticeActive) return;
    const topic = getExamTopicById(topicId);
    if (!topic || examTopic?.id === topic.id) return;

    setSessionExamTopic(topic);
    examTopicRef.current = topic;
    setExamTopic(topic);
    practiceSessionTopicRef.current = topic;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const reply = await fetchReply("", [], true);
      await deliverSofiaReply(reply);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "AI unavailable");
    } finally {
      setIsLoading(false);
    }
  }

  function releaseMicStream() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }

  function cleanupVoiceInput() {
    holdingRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    releaseMicStream();
    setRecording(false);
    setMicReady(false);
  }

  async function processRecordingBlob(blob: Blob) {
    setIsTranscribing(true);
    try {
      const text = await transcribeBlob(blob, "English");
      if (text.trim()) {
        await sendUserText(text, true);
        return;
      }
      setErrorMsg("No speech detected — hold longer and speak clearly");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice recognition failed";
      if (/401|鉴权|invalid|appid|noauth/i.test(msg)) {
        setErrorMsg(
          "Voice input unavailable — check iFlytek 语音听写 (IAT) is enabled and IFLYTEK_API_KEY / IFLYTEK_API_SECRET in .env"
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsTranscribing(false);
    }
  }

  function syncStartRecording(clientY: number) {
    if (isLoading || isTranscribing || !micReady) return;

    const stream = mediaStreamRef.current;
    if (!stream?.active) return;
    if (mediaRecorderRef.current?.state === "recording") return;

    holdingRef.current = true;
    startYRef.current = clientY;
    cancelRecordingRef.current = false;
    cancelHintRef.current = false;
    setCancelHint(false);
    chunksRef.current = [];

    const mimeType = pickMediaRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      mediaRecorderRef.current = null;
      setRecording(false);

      if (cancelRecordingRef.current) {
        cancelRecordingRef.current = false;
        return;
      }

      const ms = Date.now() - recStartRef.current;
      if (ms < 400) {
        setErrorMsg("Recording too short — hold a bit longer");
        return;
      }

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      void processRecordingBlob(blob);
    };

    recStartRef.current = Date.now();
    recorder.start(100);
    setRecording(true);
  }

  function syncStopRecording() {
    holdingRef.current = false;

    if (cancelHintRef.current) {
      cancelRecordingRef.current = true;
    }
    cancelHintRef.current = false;
    setCancelHint(false);

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }

    setRecording(false);
  }

  function moveRecording(clientY: number) {
    const cancel = startYRef.current - clientY > 60;
    cancelHintRef.current = cancel;
    setCancelHint(cancel);
  }

  useEffect(() => {
    if (!voiceMode) {
      cleanupVoiceInput();
      return;
    }

    let alive = true;
    setMicReady(false);

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        setMicReady(true);
        setErrorMsg(null);
      } catch {
        if (alive) {
          setMicReady(false);
          setErrorMsg("Microphone permission denied");
        }
      }
    })();

    return () => {
      alive = false;
      cleanupVoiceInput();
    };
  }, [voiceMode]);

  const canSend = Boolean(input.trim() || pendingImageUrl);

  function handleSend() {
    void sendMessage(input);
  }

  async function stageUserImage(file: File) {
    if (isLoading) return;

    setShowPlus(false);
    setVoiceMode(false);
    setErrorMsg(null);

    try {
      const dataUrl = await compressImageFile(file);
      setPendingImageUrl(dataUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Could not read image");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video") {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (kind === "image") {
      void stageUserImage(f);
      return;
    }

    const url = URL.createObjectURL(f);
    const userMsg: Msg = {
      id: generateId(),
      role: "user",
      ts: Date.now(),
      videoUrl: url,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    persist(next);
    setShowPlus(false);
  }

  if (!ready || !contact) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  const statusSubtitle = isSpeaking
    ? "Speaking…"
    : isLoading
      ? "Typing…"
      : speakingPracticeActive && examTopic
        ? examTopicLabel(examTopic)
        : contact.subtitle;

  const defaultName = contact.defaultName;

  const ieltsPart1Topics = ALL_EXAM_TOPICS.filter((t) => t.part === "part1");
  const ieltsPart2Topics = ALL_EXAM_TOPICS.filter((t) => t.part === "part2");
  const toeflTopics = ALL_EXAM_TOPICS.filter((t) => t.part === "independent");

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <header
        className="shrink-0 flex items-center gap-2 px-2 py-2 bg-background/85 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <Link
          to="/"
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <div
            className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ background: contact.gradient }}
          >
            {contact.initial}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] truncate">{displayName}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: "var(--color-online)" }}
              />
              <span className="truncate">{statusSubtitle}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
        >
          <Phone size={18} />
        </button>
        <button
          type="button"
          onClick={() => setShowVideoCall(true)}
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
          aria-label="Video call"
        >
          <Video size={18} />
        </button>
        <button
          type="button"
          onClick={openMoreSheet}
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
        </button>
      </header>

      {showVideoCall && contact && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-3 text-white/90">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                style={{ background: contact.gradient }}
              >
                {contact.initial}
              </div>
              <div>
                <div className="text-sm font-semibold">{displayName}</div>
                <div className="text-[11px] text-white/60 flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-online)" }}
                  />
                  FaceTime Video
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVideoCall(false)}
              className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center"
              aria-label="End call"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden mx-3 rounded-2xl bg-black">
            <video
              ref={videoRef}
              src={sofiaCallVideo}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl text-white text-xs"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
            >
              <span>Sofia is on camera</span>
              <span className="text-white/70">Los Angeles</span>
            </div>
          </div>

          <div
            className="shrink-0 flex items-center justify-center gap-10 py-8"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            <button
              type="button"
              className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center text-white"
              aria-label="Mute"
            >
              <Mic size={22} />
            </button>
            <button
              type="button"
              onClick={() => setShowVideoCall(false)}
              className="h-16 w-16 rounded-full bg-destructive flex items-center justify-center text-white shadow-lg"
              aria-label="End call"
            >
              <VideoOff size={26} />
            </button>
            <button
              type="button"
              className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center text-white"
              aria-label="Flip camera"
            >
              <Video size={22} />
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 px-3 py-2 text-xs text-center text-destructive bg-destructive/10 border-b border-border">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const grouped = prev && prev.role === m.role;
          const showDate = shouldShowDateDivider(m.ts, prev?.ts);
          const bubble = (
            <div className="flex flex-col max-w-[72%]">
              <div
                className="px-3.5 py-2 rounded-[18px] text-[15px] leading-snug"
                style={
                  m.role === "sofia"
                    ? {
                        backgroundColor: "var(--color-bubble-sofia)",
                        color: "var(--color-bubble-sofia-foreground)",
                        borderBottomLeftRadius: grouped ? 18 : 6,
                      }
                    : {
                        background: "var(--gradient-primary)",
                        color: "var(--color-bubble-user-foreground)",
                        borderBottomRightRadius: grouped ? 18 : 6,
                      }
                }
              >
                {m.text && <div>{m.text}</div>}
                {m.audioMs && (
                  <div className="flex items-center gap-2 py-0.5">
                    <Mic size={14} />
                    <div className="flex items-end gap-0.5 h-4">
                      {[6, 10, 14, 8, 12, 6, 10].map((h, idx) => (
                        <span
                          key={idx}
                          className="w-0.5 rounded-full bg-current opacity-80"
                          style={{ height: h }}
                        />
                      ))}
                    </div>
                    <span className="text-xs opacity-80">
                      {Math.max(1, Math.round(m.audioMs / 1000))}″
                    </span>
                  </div>
                )}
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="rounded-xl max-w-full max-h-64 object-cover -mx-1 my-0.5"
                  />
                )}
                {m.videoUrl && (
                  <video
                    src={m.videoUrl}
                    controls
                    className="rounded-xl max-w-full max-h-64 -mx-1 my-0.5"
                  />
                )}
              </div>
              <span
                className={`text-[10px] text-muted-foreground mt-0.5 px-1 ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatMessageTime(m.ts)}
              </span>
            </div>
          );
          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] text-muted-foreground px-3 py-1 rounded-full bg-secondary">
                    {formatDateDivider(m.ts)}
                  </span>
                </div>
              )}
              {m.role === "sofia" ? (
                <div className={`flex items-end gap-2 ${grouped ? "mt-0.5" : "mt-2.5"}`}>
                  <div className="w-7 shrink-0">
                    {!grouped && (
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-[11px]"
                        style={{ background: contact.gradient }}
                      >
                        {contact.initial}
                      </div>
                    )}
                  </div>
                  {bubble}
                </div>
              ) : (
                <div className={`flex justify-end ${grouped ? "mt-0.5" : "mt-2.5"}`}>
                  {bubble}
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-end gap-2 mt-2.5">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-[11px]"
              style={{ background: contact.gradient }}
            >
              {contact.initial}
            </div>
            <div
              className="px-3.5 py-2.5 rounded-[18px] rounded-bl-[6px]"
              style={{ backgroundColor: "var(--color-bubble-sofia)" }}
            >
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showPlus && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 grid grid-cols-4 gap-3">
          <ActionTile icon={<Camera size={22} />} label="Camera" onClick={() => photoInputRef.current?.click()} />
          <ActionTile icon={<Film size={22} />} label="Video" onClick={() => videoInputRef.current?.click()} />
          <ActionTile icon={<ImageIcon size={22} />} label="Photos" onClick={() => galleryInputRef.current?.click()} />
          <ActionTile icon={<X size={22} />} label="Close" onClick={() => setShowPlus(false)} />
        </div>
      )}

      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => handleFile(e, "video")} />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          handleFile(e, f.type.startsWith("video") ? "video" : "image");
        }}
      />

      <div
        className="shrink-0 border-t border-border bg-background/95 backdrop-blur px-2.5 py-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        {speakingPracticeActive && (
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wide">
              Topic
            </span>
            <select
              value={examTopic?.id ?? ""}
              disabled={isLoading}
              onChange={(e) => void switchTopic(e.target.value)}
              className="flex-1 min-w-0 text-[13px] px-3 py-2 rounded-xl bg-secondary border-0 outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              {ieltsPart1Topics.length > 0 && (
                <optgroup label="IELTS Part 1">
                  {ieltsPart1Topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {examTopicShortLabel(t)}
                    </option>
                  ))}
                </optgroup>
              )}
              {ieltsPart2Topics.length > 0 && (
                <optgroup label="IELTS Part 2">
                  {ieltsPart2Topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {examTopicShortLabel(t)}
                    </option>
                  ))}
                </optgroup>
              )}
              {toeflTopics.length > 0 && (
                <optgroup label="TOEFL Speaking">
                  {toeflTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {examTopicShortLabel(t)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="button"
              onClick={() => void endSpeakingPractice()}
              disabled={isLoading}
              className="shrink-0 px-3 py-2 text-[12px] font-medium rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition disabled:opacity-40"
            >
              End
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() =>
              setVoiceMode((v) => {
                if (!v) setPendingImageUrl(null);
                return !v;
              })
            }
            className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition ${
              voiceMode
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground/70 hover:bg-accent"
            }`}
            title="Toggle voice"
          >
            <Mic size={18} />
          </button>

          {!speakingPracticeActive && (
            <button
              type="button"
              onClick={() => void beginSpeakingPractice()}
              disabled={isLoading}
              className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-secondary text-foreground/70 hover:bg-accent transition disabled:opacity-40"
              title="IELTS / TOEFL speaking practice"
            >
              <GraduationCap size={18} />
            </button>
          )}

          {voiceMode ? (
            <button
              type="button"
              disabled={isLoading || isTranscribing || !micReady}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                syncStartRecording(e.clientY);
              }}
              onPointerMove={(e) => {
                if (holdingRef.current) moveRecording(e.clientY);
              }}
              onPointerUp={() => {
                syncStopRecording();
              }}
              onPointerCancel={() => {
                cancelHintRef.current = true;
                syncStopRecording();
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`flex-1 h-9 rounded-[20px] text-[14px] font-medium select-none transition touch-none ${
                recording
                  ? cancelHint
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary/15 text-primary"
                  : isTranscribing
                    ? "bg-secondary text-muted-foreground"
                    : !micReady
                      ? "bg-secondary text-muted-foreground"
                      : "bg-secondary text-foreground/80"
              }`}
            >
              {isTranscribing
                ? "Recognizing…"
                : !micReady
                  ? "Preparing mic…"
                  : recording
                    ? cancelHint
                      ? "Release to cancel"
                      : "Recording… slide up to cancel"
                    : "Hold to talk"}
            </button>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5 bg-secondary rounded-[20px] pl-3.5 pr-1 py-1 min-h-9">
              {pendingImageUrl && (
                <div className="relative self-start pt-1 pl-0.5">
                  <img
                    src={pendingImageUrl}
                    alt="Photo to send"
                    className="h-16 w-16 rounded-lg object-cover border border-border/60"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImageUrl(null)}
                    disabled={isLoading}
                    className="absolute -top-0.5 -right-1.5 h-5 w-5 rounded-full bg-foreground/80 text-background flex items-center justify-center disabled:opacity-40"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-1">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSend && handleSend()}
                  onFocus={() => setShowPlus(false)}
                  placeholder={pendingImageUrl ? "Add a caption…" : "Message"}
                  disabled={isLoading}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[15px] py-1.5 placeholder:text-muted-foreground"
                />
                {canSend && (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isLoading}
                    className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-primary-foreground transition"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <ArrowUp size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPlus((v) => !v)}
            className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition ${
              showPlus
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground/70 hover:bg-accent"
            }`}
            title="More"
          >
            <Plus size={18} className={showPlus ? "rotate-45 transition" : "transition"} />
          </button>
        </div>
      </div>

      <Sheet open={showMoreSheet} onOpenChange={setShowMoreSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Chat settings</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Remark name
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                Only visible to you · default: {defaultName}
              </p>
              <input
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                placeholder={defaultName}
                className="w-full px-4 py-3 rounded-xl bg-secondary border-0 outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <button
                type="button"
                onClick={saveRemark}
                disabled={!remarkDraft.trim()}
                className="w-full mt-3 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40"
              >
                Save name
              </button>
            </div>
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/15 transition"
              >
                Clear chat history
              </button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Clears casual and speaking practice messages
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              All messages with {displayName} will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleClearHistory()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-1 active:opacity-70 transition"
    >
      <span className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-foreground/80">
        {icon}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}
