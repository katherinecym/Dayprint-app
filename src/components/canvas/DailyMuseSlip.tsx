"use client";

import React, { useState, useEffect } from "react";
import { Compass, Feather, Lightbulb, Mail, Telescope, Dices, PenTool, Check, RefreshCw } from "lucide-react";
import { playPaperRipSound, playKeyClick } from "@/lib/sound";
import { useMemory } from "@/lib/memory-context";

interface DailyMuseSlipProps {
  onInsertPrompt: (promptText: string) => void;
}

interface MusePack {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  promptsZh: string[];
  promptsEn: string[];
}

const MUSE_PACKS: MusePack[] = [
  {
    id: "thursday_core",
    nameZh: "决策第一性",
    nameEn: "Core Decisions",
    descZh: "聚焦长期复利、核心护城河与底层第一性原理",
    descEn: "Long-term compounding, first principles, and load-bearing choices",
    icon: Compass,
    promptsZh: [
      "今天做出的哪个微小决定，可能会在半年后产生复利效应？",
      "如果把你今天的所有忙碌砍掉 80%，剩下真正支撑核心价值的 20% 是什么？",
      "今天发生的哪件事，悄悄推翻了你过去坚信的某个预设？",
      "如果某个选择让你感到犹豫不决，你内心里真正害怕失去的是什么？",
      "写下一个你今天为了追求效率而忽略的底层原则。",
    ],
    promptsEn: [
      "Which small decision you made today might yield compounding returns in six months?",
      "If you cut 80% of today's busyness, what is the truly load-bearing 20% left behind?",
      "What event today quietly dismantled a premise you previously took for granted?",
      "If a choice made you hesitate, what were you genuinely afraid of losing?",
      "Name one foundational principle you bypassed today in pursuit of immediate speed.",
    ],
  },
  {
    id: "sensory_micro",
    nameZh: "生活微光",
    nameEn: "Sensory Warmth",
    descZh: "聚焦日常治愈、光影触感与细微诗意",
    descEn: "Everyday warmth, gentle light, textures, and sensory poetry",
    icon: Feather,
    promptsZh: [
      "如果把你今天的一段遭遇拍成黑白电影，哪个瞬间最值得停留三秒？",
      "今天有什么微小的瞬间让你感到‘世界其实挺奇妙’？",
      "如果用一种气味或某种颜色来凝固今天的心境，会是什么？",
      "今天吃到的、看到的或听到的哪样东西，让你在一瞬间感到被治愈？",
      "走在路上或坐在窗前时，今天哪一处光影的变化吸引了你的注意？",
    ],
    promptsEn: [
      "If a segment of today were filmed in monochrome, which three seconds deserve a freeze-frame?",
      "What fleeting moment today made you feel 'the world is actually quite marvelous'?",
      "If you had to capture today's headspace as a single scent or watercolor wash, what would it be?",
      "What single taste, sight, or sound unexpectedly comforted you today?",
      "What subtle shift of afternoon light caught your eye on the sidewalk or desk?",
    ],
  },
  {
    id: "cognitive_flip",
    nameZh: "认知反转",
    nameEn: "Cognitive Shift",
    descZh: "挑战固有偏见、深挖隐性因果与被忽视的真相",
    descEn: "Challenging hidden assumptions and unearthing blindspots",
    icon: Lightbulb,
    promptsZh: [
      "今天和谁的一句简短对话，让你在回家的路上反复琢磨？",
      "今天听到最想反驳的一句话是什么？如果站在对方立场，他的合理性在哪里？",
      "写下今天你最想推翻的一个既定共识，哪怕它听起来很离经叛道。",
      "今天有什么事情的发展完全出乎意料？背后的真正隐性变量是什么？",
      "今天你是在按别人的期待做反应，还是在按自己的意志做创造？",
    ],
    promptsEn: [
      "Which brief remark from someone lingered in your mind on the journey home?",
      "What statement did you most want to dispute today? What validity does it hold from their side?",
      "Name one widely accepted convention you felt like questioning today.",
      "What unfolded entirely outside your expectations, and what was the real hidden variable?",
      "Were you reacting to external prompts today, or authoring your own trajectory?",
    ],
  },
  {
    id: "future_anchor",
    nameZh: "未来信件",
    nameEn: "Future Anchor",
    descZh: "超越当下焦虑，与十年后的自己展开时空对话",
    descEn: "Looking back from a decade away with calm perspective",
    icon: Mail,
    promptsZh: [
      "如果未来的你从 2036 年寄来一封信，你猜他会如何评价今天所做的决定？",
      "今天记录下的这段文字，如果被 10 年后的你偶然翻出，你希望它传递怎样的力量？",
      "今天有什么事情，即使在十年后回看依然微不足道，但今天却耗费了你太多心力？",
      "现在的你正在为未来哪个不可逆转的时刻积攒底牌？",
      "想象十年后你在一个晴朗的午后回看今天，你会给此时的自己一个怎样的微笑？",
    ],
    promptsEn: [
      "If a note arrived from you in 2036, how would future-you assess today's choices?",
      "If you stumble across these words a decade later, what enduring strength should they offer?",
      "What occupied your nerves today that will register as completely trivial ten years hence?",
      "What invisible resilience or competence are you quietly building for a future horizon?",
      "Looking back from a calm afternoon ten years out, what gentle smile would you offer yourself?",
    ],
  },
  {
    id: "ai_curated",
    nameZh: "深度追问",
    nameEn: "Custom Probes",
    descZh: "根据你最近手账与深空星图节点生成的个性化问题",
    descEn: "Custom prompts generated from your recent notes & open graph loops",
    icon: Telescope,
    promptsZh: [
      "回溯《架构简化》：今天你在工作流或人际中，真正忍痛删掉某段冗余了吗？",
      "回溯《人际消耗》：今天你是否建立起了属于自己的精力防火墙？",
      "星图连线探索：你是否注意到了‘认知拓扑’与‘秋季光影’之间的隐秘因果？",
      "持续思考印记：今天你的行动是在播种，还是在消费昨天的存粮？",
    ],
    promptsEn: [
      "Reflection on Simplification: Did you actually prune a redundant routine today?",
      "Note on Energy Boundaries: Did you guard your quiet focus hours?",
      "Graph Connection Probe: What hidden bridge unites your morning thoughts and tonight's goal?",
      "Recurring Focus: Did today's effort plant seeds or consume reserves?",
    ],
  },
];

export function DailyMuseSlip({ onInsertPrompt }: DailyMuseSlipProps) {
  const { language } = useMemory();

  // Time-context slot (Inspired by Apple Journal's context-aware suggestions)
  const [timeSlot, setTimeSlot] = useState({
    badgeZh: "今日灵感",
    badgeEn: "Daily Muse",
    defaultPack: "thursday_core",
  });
  const [activePackId, setActivePackId] = useState<string>("thursday_core");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeSlot({ badgeZh: "晨间意图", badgeEn: "Morning Intention", defaultPack: "thursday_core" });
      setActivePackId("thursday_core");
    } else if (hour >= 12 && hour < 18) {
      setTimeSlot({ badgeZh: "午后聚焦", badgeEn: "Afternoon Focus", defaultPack: "cognitive_flip" });
      setActivePackId("cognitive_flip");
    } else {
      setTimeSlot({ badgeZh: "夜间沉淀", badgeEn: "Evening Reflection", defaultPack: "sensory_micro" });
      setActivePackId("sensory_micro");
    }
  }, []);
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPromptsZh, setAiPromptsZh] = useState<string[]>([]);
  const [aiPromptsEn, setAiPromptsEn] = useState<string[]>([]);
  const [insertedFeedback, setInsertedFeedback] = useState<boolean>(false);

  const activePack = MUSE_PACKS.find((p) => p.id === activePackId) || MUSE_PACKS[0];

  const currentPrompts = activePackId === "ai_curated" && aiPromptsZh.length > 0
    ? (language === "zh" ? [...aiPromptsZh, ...activePack.promptsZh] : [...aiPromptsEn, ...activePack.promptsEn])
    : (language === "zh" ? activePack.promptsZh : activePack.promptsEn);

  const currentPrompt = currentPrompts[promptIndex % currentPrompts.length];

  const handleNextPrompt = () => {
    playPaperRipSound();
    setIsAnimating(true);
    setTimeout(() => {
      setPromptIndex((prev) => (prev + 1) % currentPrompts.length);
      setIsAnimating(false);
    }, 140);
  };

  const handleSelectPack = (packId: string) => {
    playKeyClick();
    setActivePackId(packId);
    setPromptIndex(0);
  };

  const handleAiGenerate = () => {
    playKeyClick();
    setIsAiGenerating(true);
    setTimeout(() => {
      const newPromptZh = "如果把今天你遇到的最大阻滞视作一次隐性升级，它迫使你重构了哪项心智工具？";
      const newPromptEn = "If today's biggest friction were a disguised gift, what mental tool did it compel you to upgrade?";
      setAiPromptsZh((prev) => [newPromptZh, ...prev]);
      setAiPromptsEn((prev) => [newPromptEn, ...prev]);
      setActivePackId("ai_curated");
      setPromptIndex(0);
      setIsAiGenerating(false);
      playPaperRipSound();
    }, 550);
  };

  const handleInsert = () => {
    playKeyClick();
    onInsertPrompt(currentPrompt);
    setInsertedFeedback(true);
    setTimeout(() => setInsertedFeedback(false), 2000);
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-dashed border-[#C49A56]/40 bg-[#C49A56]/8 text-xs font-sans text-stone-800 transition-all hover:bg-[#C49A56]/12 shadow-2xs">
      {/* Left: Muse Tag + Time-slot Context + Prompt Text */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#926E2B] shrink-0 tracking-wider">
          <Compass className="w-3.5 h-3.5 text-[#C49A56]" />
          <span className="hidden sm:inline">{language === "zh" ? "灵感" : "MUSE"}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C49A56]/20 text-[#825B1D] font-mono font-medium">
            {language === "zh" ? timeSlot.badgeZh : timeSlot.badgeEn}
          </span>
        </span>
        <span className="text-stone-300 shrink-0">•</span>
        <p
          className={`text-xs text-stone-800 truncate font-normal leading-normal transition-opacity duration-150 ${
            isAnimating ? "opacity-30" : "opacity-100"
          }`}
          title={currentPrompt}
        >
          “{currentPrompt}”
        </p>
      </div>

      {/* Right: Actions (Next & Answer) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleNextPrompt}
          className="p-1 sm:px-2 sm:py-1 rounded-md text-[11px] text-[#926E2B] hover:text-[#785920] hover:bg-white/70 flex items-center gap-1 transition-colors cursor-pointer"
          title={language === "zh" ? "换一签灵感" : "Next prompt"}
        >
          <RefreshCw className="w-3 h-3 text-[#C49A56]" />
          <span className="hidden sm:inline">{language === "zh" ? "换一签" : "Next"}</span>
        </button>

        <button
          type="button"
          onClick={handleInsert}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#C97A63] text-white hover:bg-[#B56752] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          title={language === "zh" ? "将此灵感载入下方输入框作答" : "Answer this prompt in today's journal"}
        >
          {insertedFeedback ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>{language === "zh" ? "已载入" : "Loaded"}</span>
            </>
          ) : (
            <>
              <PenTool className="w-3 h-3 text-white" />
              <span>{language === "zh" ? "以此作答" : "Answer"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
