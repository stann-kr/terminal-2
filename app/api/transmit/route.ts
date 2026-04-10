import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { transmitLogs } from "@/lib/db/schema";


/**
 * GET /api/transmit
 * 방명록 목록을 최신순으로 50개 반환함.
 */
export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);

    const logs = await db
      .select()
      .from(transmitLogs)
      .orderBy(desc(transmitLogs.createdAt))
      .limit(50)
      .all();

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[GET /api/transmit] error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transmit
 * 방명록에 새 항목을 추가함.
 *
 * @body handle - 방문자 별칭 (1–24자, 공백 → 언더스코어, 대문자 저장)
 * @body message - 방문자 메시지 (1–280자)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, string>;
    const rawHandle: string = body?.handle ?? "";
    const rawMessage: string = body?.message ?? "";

    // 입력값 검증
    const handle = rawHandle.trim().replace(/\s+/g, "_").toUpperCase();
    const message = rawMessage.trim();

    if (!handle) {
      return NextResponse.json({ error: "HANDLE_REQUIRED" }, { status: 400 });
    }
    if (handle.length > 24) {
      return NextResponse.json(
        { error: "HANDLE_TOO_LONG" },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: "MESSAGE_REQUIRED" },
        { status: 400 }
      );
    }
    if (message.length > 280) {
      return NextResponse.json(
        { error: "MESSAGE_TOO_LONG" },
        { status: 400 }
      );
    }

    const now = new Date();
    const id = String(now.getTime());
    const ts = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} / ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const { env } = getCloudflareContext();
    const db = getDb(env.DB);

    const newLog = { id, handle, message, ts, createdAt: now.toISOString() };
    await db.insert(transmitLogs).values(newLog);

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transmit] error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
