/**
 * Feishu / Lark Bot Notification Helper for Dayprint App
 * Alerts the user via Feishu Bot when GitHub PAT expires or cloud sync fails.
 */

interface FeishuAlertParams {
  title: string;
  message: string;
  actionGuide?: string;
}

let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes debounce to prevent notification storms

export async function sendFeishuAlert({
  title,
  message,
  actionGuide,
}: FeishuAlertParams): Promise<boolean> {
  const now = Date.now();
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
    return false; // Debounced
  }

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const openId =
    process.env.FEISHU_ADMIN_OPEN_ID || "ou_c81169499271c833466d101ff83ed8e7";

  if (!appId || !appSecret || !openId) {
    console.warn("[FeishuAlert] Missing FEISHU_APP_ID, FEISHU_APP_SECRET, or FEISHU_ADMIN_OPEN_ID");
    return false;
  }

  try {
    // 1. Get tenant access token
    const tokenRes = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      }
    );

    if (!tokenRes.ok) {
      console.warn("[FeishuAlert] Failed to get tenant_access_token");
      return false;
    }

    const tokenData = await tokenRes.json();
    const tat = tokenData.tenant_access_token;
    if (!tat) return false;

    // 2. Format alert content
    let text = `🚨 **${title}**\n\n${message}\n`;
    if (actionGuide) {
      text += `\n👉 **处置建议**：\n${actionGuide}\n`;
    }
    const timeStr = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });
    text += `\n*时间：${timeStr}*`;

    // 3. Send message via Feishu OpenAPI
    const msgRes = await fetch(
      "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tat}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          receive_id: openId,
          msg_type: "text",
          content: JSON.stringify({ text }),
        }),
      }
    );

    const msgData = await msgRes.json();
    if (msgData.code === 0) {
      lastAlertTime = now;
      console.info("[FeishuAlert] Sent alert to user via Feishu Bot:", title);
      return true;
    } else {
      console.warn("[FeishuAlert] Message API returned code:", msgData.code, msgData.msg);
      return false;
    }
  } catch (err) {
    console.error("[FeishuAlert] Exception while sending alert:", err);
    return false;
  }
}
