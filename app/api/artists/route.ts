import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { artists } from "@/lib/db/schema";


/**
 * GET /api/artists?eventId={id}
 * 특정 이벤트의 아티스트 목록을 반환함.
 *
 * @query eventId - 이벤트 ID (필수)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "EVENT_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const { env } = getCloudflareContext();
    const db = getDb(env.DB);

    const rows = await db
      .select()
      .from(artists)
      .where(eq(artists.eventId, eventId))
      .all();

    // data JSON 파싱 후 Artist 형태로 변환 (guestCode는 서버 전용 — 응답에서 제외)
    const result = rows.map((row) => {
      const { guestCode: _gc, ...artistData } = JSON.parse(row.data) as Record<string, unknown>;
      return { id: row.id, eventId: row.eventId, ...artistData };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/artists] error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
