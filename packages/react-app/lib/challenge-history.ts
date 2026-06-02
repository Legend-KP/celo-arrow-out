import "server-only"

import {
    readDb,
    writeDb
} from "./firebase-server"

import type { UniversalProgress } from "./types"

export const CHALLENGE_HISTORY_PATH_PREFIX =
    "universal/challengeHistory"

const LEADERBOARD_VERSION = 1

export interface ChallengeHistoryRecord {
    cycleIndex: number
    patternName: string
    weeklyChallengeEndUnixMilliseconds: number
    archivedAt: number
    leaderboardMeta: {
        cycleIndex: number
        patternName: string
        version: number
        updatedAt: number
    } | null
    leaderboardTop25: Record<
        string,
        {
            playerName: string
            walletAddress: string
            completionSeconds: number
            updatedAt: number
        }
    >
}

export function getChallengeHistoryPath(
    cycleIndex: number
) {
    const safeIndex = Math.max(
        0,
        Math.floor(cycleIndex)
    )

    return `${CHALLENGE_HISTORY_PATH_PREFIX}/${safeIndex}`
}

function readRawLeaderboardTop25(
    state: any
) {
    return (
        state?.leaderboardTop25 ||
        state?.leaderboard ||
        {}
    ) as Record<
        string,
        ChallengeHistoryRecord["leaderboardTop25"][string]
    >
}

function resolveLeaderboardMeta(
    state: any,
    stored: UniversalProgress
) {
    const cycleIndex = Number(
        state?.leaderboardMeta?.cycleIndex ??
            state?.leaderboardCycleIndex ??
            stored.weeklyChallengeCycleIndex
    )
    const patternName =
        typeof state?.leaderboardMeta
            ?.patternName === "string" &&
        state.leaderboardMeta.patternName.trim()
            ? state.leaderboardMeta.patternName.trim()
            : typeof state?.leaderboardPatternName ===
                  "string" &&
              state.leaderboardPatternName.trim()
              ? state.leaderboardPatternName.trim()
              : stored.weeklyChallengePatternName

    return {
        cycleIndex: Number.isFinite(
            cycleIndex
        )
            ? cycleIndex
            : stored.weeklyChallengeCycleIndex,
        patternName,
        version: Number(
            state?.leaderboardMeta?.version ??
                LEADERBOARD_VERSION
        ),
        updatedAt: Number(
            state?.leaderboardMeta?.updatedAt ||
                Date.now()
        )
    }
}

export function buildChallengeHistoryRecord(
    snapshot: any,
    stored: UniversalProgress,
    archivedAt = Date.now()
): ChallengeHistoryRecord {
    const leaderboardTop25 =
        readRawLeaderboardTop25(snapshot)

    return {
        cycleIndex:
            stored.weeklyChallengeCycleIndex,
        patternName:
            stored.weeklyChallengePatternName,
        weeklyChallengeEndUnixMilliseconds:
            stored.weeklyChallengeEndUnixMilliseconds,
        archivedAt,
        leaderboardMeta:
            Object.keys(leaderboardTop25)
                .length > 0 ||
            snapshot?.leaderboardMeta ||
            snapshot?.leaderboardCycleIndex !==
                undefined
                ? resolveLeaderboardMeta(
                      snapshot,
                      stored
                  )
                : null,
        leaderboardTop25
    }
}

export function hasArchivableLeaderboard(
    snapshot: any
) {
    const entries =
        readRawLeaderboardTop25(snapshot)

    return (
        Object.keys(entries).length > 0 ||
        !!snapshot?.leaderboardMeta ||
        snapshot?.leaderboardCycleIndex !==
            undefined
    )
}

export async function archiveChallengeLeaderboardIfNeeded(
    snapshot: any,
    stored: UniversalProgress
) {
    if (
        !snapshot ||
        !stored ||
        !hasArchivableLeaderboard(snapshot)
    ) {
        return false
    }

    const historyPath =
        getChallengeHistoryPath(
            stored.weeklyChallengeCycleIndex
        )
    const existing =
        await readDb<any>(historyPath)

    if (existing?.archivedAt) {
        return false
    }

    const record =
        buildChallengeHistoryRecord(
            snapshot,
            stored
        )

    await writeDb(
        historyPath,
        record
    )

    return true
}

export async function getChallengeHistory(
    cycleIndex: number
) {
    const historyPath =
        getChallengeHistoryPath(cycleIndex)
    const record =
        await readDb<ChallengeHistoryRecord | null>(
            historyPath
        )

    if (!record?.archivedAt) {
        return null
    }

    return record
}
