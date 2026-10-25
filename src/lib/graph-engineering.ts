import { CanonicalMemory, Relationship, RelationType, MemoryType, getLocalizedTitle, getLocalizedContent } from "../types/memory";

export interface KnowledgeNode {
  id: string;
  title: string;
  type: MemoryType | "hub";
  content: string;
  occurred_at: string;
  topics: string[];
  connectionsCount: number;
  media_url?: string;
  x?: number;
  y?: number;
}

export interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  type: RelationType;
  label: string;
}

export interface LLMWikiArticle {
  topic: string;
  title: string;
  summary: string;
  key_insights: string[];
  timeline: {
    id: string;
    title: string;
    date: string;
    type: MemoryType;
    snippet: string;
  }[];
  related_topics: string[];
  open_loops: string[];
  memory_ids: string[];
}

/**
 * Build an in-memory knowledge graph representation with centrality
 */
export function buildKnowledgeGraph(
  memories: CanonicalMemory[],
  relationships: Relationship[],
  lang: "en" | "zh" = "en"
): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
  // Count connections per memory
  const connectionCounts: Record<string, number> = {};
  relationships.forEach((r) => {
    connectionCounts[r.from_memory_id] = (connectionCounts[r.from_memory_id] || 0) + 1;
    connectionCounts[r.to_memory_id] = (connectionCounts[r.to_memory_id] || 0) + 1;
  });

  const nodes: KnowledgeNode[] = memories.map((m) => ({
    id: m.id,
    title: getLocalizedTitle(m, lang),
    type: m.type,
    content: getLocalizedContent(m, lang),
    occurred_at: m.occurred_at,
    topics: m.topics,
    connectionsCount: connectionCounts[m.id] || 0,
    media_url: m.media_url,
  }));

  const edges: KnowledgeEdge[] = relationships.map((r) => {
    let label = lang === "zh" ? "关联" : "Related";
    switch (r.type) {
      case "same_topic":
        label = lang === "zh" ? "同主题" : "Topic";
        break;
      case "same_project":
        label = lang === "zh" ? "同项目" : "Project";
        break;
      case "decision_outcome":
        label = lang === "zh" ? "决策产出" : "Decision";
        break;
      case "temporal_sequence":
        label = lang === "zh" ? "时间承接" : "Sequence";
        break;
      case "references":
        label = lang === "zh" ? "引用参考" : "Reference";
        break;
      case "semantic_similarity":
        label = lang === "zh" ? "概念相似" : "Semantic";
        break;
      default:
        label = lang === "zh" ? "关联" : "Related";
    }
    return {
      id: r.id,
      from: r.from_memory_id,
      to: r.to_memory_id,
      type: r.type,
      label,
    };
  });

  return { nodes, edges };
}

/**
 * Graph Engineering Compiler: Discovers latent semantic and causal edges
 * Automatically links memories that share topics or temporal causality
 */
export function autoCompileGraphRelationships(
  memories: CanonicalMemory[],
  existingRels: Relationship[],
  lang: "en" | "zh" = "en"
): Relationship[] {
  const existingSet = new Set(
    existingRels.map((r) => `${r.from_memory_id}__${r.to_memory_id}`)
  );
  const newRels: Relationship[] = [...existingRels];

  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const a = memories[i];
      const b = memories[j];

      const keyForward = `${a.id}__${b.id}`;
      const keyBackward = `${b.id}__${a.id}`;
      if (existingSet.has(keyForward) || existingSet.has(keyBackward)) {
        continue;
      }

      // 1. Shared topics connection
      const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
      if (sharedTopics.length >= 1) {
        newRels.push({
          id: `rel_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          from_memory_id: a.id,
          to_memory_id: b.id,
          type: "same_topic",
          origin: "ai_suggested",
          reason: lang === "zh"
            ? `共同属于 #${sharedTopics.join(", #")} 思考流`
            : `Shared stream #${sharedTopics.join(", #")}`,
          status: "confirmed",
          created_at: new Date().toISOString(),
        });
        existingSet.add(keyForward);
        continue;
      }

      // 2. Temporal sequence for ideas -> decisions/plans within 48 hours
      const timeA = new Date(a.occurred_at).getTime();
      const timeB = new Date(b.occurred_at).getTime();
      const hoursDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);

      if (hoursDiff <= 48) {
        if (a.type === "idea" && (b.type === "decision" || b.type === "plan")) {
          newRels.push({
            id: `rel_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            from_memory_id: a.id,
            to_memory_id: b.id,
            type: "decision_outcome",
            origin: "ai_suggested",
            reason: lang === "zh"
              ? "灵感触发后续决策与行动规划"
              : "Idea triggered subsequent decision and action plan",
            status: "confirmed",
            created_at: new Date().toISOString(),
          });
          existingSet.add(keyForward);
        } else if (a.type === "learning" && b.type === "idea") {
          newRels.push({
            id: `rel_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            from_memory_id: a.id,
            to_memory_id: b.id,
            type: "temporal_sequence",
            origin: "ai_suggested",
            reason: lang === "zh"
              ? "新知学习孕育后续顿悟灵感"
              : "Learning fostered subsequent realization",
            status: "confirmed",
            created_at: new Date().toISOString(),
          });
          existingSet.add(keyForward);
        }
      }
    }
  }

  return newRels;
}

/**
 * Memory Hub Compiler: Compiles fragmented memories into living Topic Dossiers
 */
export function compileLLMWiki(
  memories: CanonicalMemory[],
  relationships: Relationship[],
  lang: "en" | "zh" = "en"
): LLMWikiArticle[] {
  // 1. Group memories by topic
  const topicMap: Record<string, CanonicalMemory[]> = {};

  memories.forEach((m) => {
    m.topics.forEach((topic) => {
      const cleanTopic = topic.trim().toLowerCase();
      if (!cleanTopic) return;
      if (!topicMap[cleanTopic]) topicMap[cleanTopic] = [];
      topicMap[cleanTopic].push(m);
    });
  });

  // 2. Generate synthesized wiki article for each topic
  const articles: LLMWikiArticle[] = Object.entries(topicMap).map(([topic, mems]) => {
    // Sort chronologically for evolution timeline
    const sortedTimeline = [...mems]
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .map((m) => {
        const localizedTitle = getLocalizedTitle(m, lang);
        const localizedContent = getLocalizedContent(m, lang);
        return {
          id: m.id,
          title: localizedTitle,
          date: m.occurred_at.slice(0, 10),
          type: m.type,
          snippet: localizedContent ? localizedContent.slice(0, 75) + "..." : localizedTitle,
        };
      });

    // Extract learnings and decisions as key insights
    const insights: string[] = [];
    mems.forEach((m) => {
      const mTitle = getLocalizedTitle(m, lang);
      const mContent = getLocalizedContent(m, lang);
      if (m.type === "learning" || m.type === "decision") {
        const colon = lang === "zh" ? "：" : ": ";
        insights.push(`[${m.type.toUpperCase()}] ${mTitle}${mContent ? `${colon}${mContent.slice(0, 60)}` : ""}`);
      } else if (m.type === "idea" && insights.length < 3) {
        insights.push(`[IDEA] ${mTitle}`);
      }
    });

    if (insights.length === 0 && mems.length > 0) {
      insights.push(
        lang === "zh"
          ? `收录了 ${mems.length} 条碎片，构成关于「${topic}」的初步认知底图。`
          : `Synthesizes ${mems.length} memory fragments forming the conceptual basis for #${topic}.`
      );
    }

    // Extract open loops from plans and unanswered threads
    const openLoops: string[] = [];
    mems.forEach((m) => {
      if (m.type === "plan") {
        openLoops.push(
          lang === "zh"
            ? `待推进计划：${getLocalizedTitle(m, lang)}`
            : `Pending plan: ${getLocalizedTitle(m, lang)}`
        );
      }
    });

    // Find cross-referenced related topics
    const relatedTopicSet = new Set<string>();
    mems.forEach((m) => {
      m.topics.forEach((t) => {
        const cleanT = t.trim().toLowerCase();
        if (cleanT !== topic) relatedTopicSet.add(cleanT);
      });
    });

    // Build synthesized narrative summary
    const typeCounts: Record<string, number> = {};
    mems.forEach((m) => {
      typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
    });
    const typeBreakdown = Object.entries(typeCounts)
      .map(([type, count]) => (lang === "zh" ? `${count}条${type}` : `${count} ${type}(s)`))
      .join(lang === "zh" ? "、" : ", ");

    const earliestDate = sortedTimeline[0]?.date || (lang === "zh" ? "近期" : "Recent");
    const latestDate = sortedTimeline[sortedTimeline.length - 1]?.date || (lang === "zh" ? "至今" : "Present");

    const summary = lang === "zh"
      ? `本词条由知识图谱引擎自动提炼，涵盖从 ${earliestDate} 至 ${latestDate} 期间沉淀的 ${mems.length} 个记忆节点（包含 ${typeBreakdown}）。在思考脉络中，围绕「#${topic}」的记录呈现出从初期灵感直觉逐步演化至具体认知与行动决策的知识递进结构。`
      : `Synthesized by the cognitive knowledge graph engine, covering ${mems.length} memory nodes (${typeBreakdown}) recorded between ${earliestDate} and ${latestDate}. The cognitive trajectory surrounding #${topic} exhibits a coherent knowledge progression from intuitive sparks to concrete decisions and actions.`;

    return {
      topic,
      title: topic.charAt(0).toUpperCase() + topic.slice(1),
      summary,
      key_insights: insights.slice(0, 5),
      timeline: sortedTimeline,
      related_topics: Array.from(relatedTopicSet).slice(0, 5),
      open_loops: openLoops.slice(0, 4),
      memory_ids: mems.map((m) => m.id),
    };
  });

  // Sort articles by memory count (most comprehensive concepts first)
  return articles.sort((a, b) => b.memory_ids.length - a.memory_ids.length);
}
