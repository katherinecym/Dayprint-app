import { CanonicalMemory, LayoutType } from "@/types/memory";

export interface ComputedGridCard {
  memory: CanonicalMemory;
  colSpan: number;
  rowSpan: number;
  colorBorder?: string;
  accentBg?: string;
}

export function computeMemoryLayout(
  memories: CanonicalMemory[],
  layoutType: LayoutType,
  todayId?: string
): ComputedGridCard[] {
  // Sort and filter memories based on layout type
  let sorted = [...memories];

  if (layoutType === "chronological") {
    sorted.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  } else if (layoutType === "by_type") {
    const typeOrder: Record<string, number> = {
      idea: 1,
      moment: 2,
      learning: 3,
      decision: 4,
      plan: 5,
      collection: 6,
      receipt: 7,
      generic: 8,
    };
    sorted.sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99));
  } else if (layoutType === "thematic") {
    sorted.sort((a, b) => (a.topics[0] || "").localeCompare(b.topics[0] || ""));
  } else if (layoutType === "by_connection") {
    sorted.sort((a, b) => (b.relations?.length || 0) - (a.relations?.length || 0));
  }

  return sorted.map((mem, index) => {
    let colSpan = 1;
    let rowSpan = 1;

    if (layoutType === "focus") {
      // Surrounding cards are small and subtle
      colSpan = 1;
      rowSpan = 1;
    } else if (layoutType === "compact") {
      colSpan = 1;
      rowSpan = 1;
    } else {
      // Balanced / Default Boogie Woogie rhythm
      if (index === 0 || mem.id === todayId) {
        colSpan = 2;
        rowSpan = 2;
      } else if (index % 5 === 0) {
        colSpan = 2;
        rowSpan = 1;
      } else if (index % 7 === 0) {
        colSpan = 1;
        rowSpan = 2;
      } else {
        colSpan = 1;
        rowSpan = 1;
      }
    }

    // Determine type color accents
    let colorBorder = "#1F1F1F";
    let accentBg = "#FFFFFF";

    switch (mem.type) {
      case "idea":
        accentBg = "#FFF5F2";
        colorBorder = "#F25B40";
        break;
      case "learning":
        accentBg = "#F0F4FF";
        colorBorder = "#3155D9";
        break;
      case "moment":
        accentBg = "#FEFAF0";
        colorBorder = "#F4C94C";
        break;
      case "decision":
        accentBg = "#FAFAFA";
        colorBorder = "#1F1F1F";
        break;
      case "plan":
        accentBg = "#FEFCF5";
        colorBorder = "#E5B83B";
        break;
      default:
        accentBg = "#FFFFFF";
        colorBorder = "#1F1F1F";
        break;
    }

    return {
      memory: mem,
      colSpan,
      rowSpan,
      colorBorder,
      accentBg,
    };
  });
}
