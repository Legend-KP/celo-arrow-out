import type { UniversalProgress } from "./types"

/** Matches Unity `GameDataStore.ChallengeEpochUtc` (2026-04-27 UTC). */
export const CHALLENGE_EPOCH_UNIX_MS = Date.UTC(
    2026,
    3,
    27,
    0,
    0,
    0,
    0
)

export const CHALLENGE_CYCLE_DAYS = 7

const UNIX_EPOCH_UNIX_MS = Date.UTC(
    1970,
    0,
    1,
    0,
    0,
    0,
    0
)

const MS_PER_DAY = 86_400_000

/** Same order as Unity `MenuSceneController.challengePatternNames` (34 entries). */
export const CHALLENGE_PATTERN_NAMES = [
    "Cow",
    "Heart",
    "Leaf",
    "Star",
    "Octagon",
    "Wolf",
    "Semi-Circle",
    "Apple",
    "Sun",
    "Guitar pick",
    "Arrow",
    "Glass",
    "Diamond",
    "Dog",
    "Butterfly",
    "Cloud",
    "X",
    "Triangle",
    "Spades",
    "Pentagon",
    "Hexagon",
    "Bat",
    "Ninja Star",
    "Flag",
    "Flower",
    "Leaf2",
    "Plane",
    "Human",
    "Energy",
    "Flame",
    "Call",
    "Tree",
    "Video",
    "Mountains"
] as const

export const DEFAULT_WEEKLY_CHALLENGE: UniversalProgress =
    {
        weeklyChallengeCycleIndex: 0,
        weeklyChallengeEndUnixMilliseconds: 0,
        weeklyChallengePatternName:
            CHALLENGE_PATTERN_NAMES[0]
    }

/** Firebase PATCH `null` removes keys — clears stale leaderboard without a second request. */
export const LEADERBOARD_CLEAR_PATCH = {
    leaderboardTop25: null,
    leaderboard: null,
    leaderboardMeta: null,
    leaderboardCycleIndex: null,
    leaderboardPatternName: null
} as const

export function getUtcDayNumber(
    nowMs: number
) {
    const now = new Date(nowMs)
    const utcMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    )

    return Math.floor(
        (utcMidnight - UNIX_EPOCH_UNIX_MS) /
            MS_PER_DAY
    )
}

/** 0-based index; matches Unity `GetCurrentChallengeCycleIndex`. */
export function getCurrentChallengeCycleIndex(
    nowMs = Date.now()
) {
    const elapsedDays = Math.max(
        0,
        getUtcDayNumber(nowMs) -
            getUtcDayNumber(
                CHALLENGE_EPOCH_UNIX_MS
            )
    )

    return Math.floor(
        elapsedDays / CHALLENGE_CYCLE_DAYS
    )
}

export function getCurrentChallengeCycleEndMs(
    nowMs = Date.now()
) {
    const cycleIndex =
        getCurrentChallengeCycleIndex(
            nowMs
        )

    return (
        CHALLENGE_EPOCH_UNIX_MS +
        (cycleIndex + 1) *
            CHALLENGE_CYCLE_DAYS *
            MS_PER_DAY
    )
}

export function getPatternNameForCycleIndex(
    cycleIndex: number
) {
    const safeIndex = Math.max(
        0,
        Math.floor(cycleIndex)
    )

    return CHALLENGE_PATTERN_NAMES[
        safeIndex %
            CHALLENGE_PATTERN_NAMES.length
    ]
}

export function computeWeeklyChallenge(
    nowMs = Date.now()
): UniversalProgress {
    const cycleIndex =
        getCurrentChallengeCycleIndex(
            nowMs
        )

    return {
        weeklyChallengeCycleIndex:
            cycleIndex,
        weeklyChallengeEndUnixMilliseconds:
            getCurrentChallengeCycleEndMs(
                nowMs
            ),
        weeklyChallengePatternName:
            getPatternNameForCycleIndex(
                cycleIndex
            )
    }
}

export function readStoredUniversal(
    snapshot: any
): UniversalProgress | null {
    if (!snapshot) {
        return null
    }

    const rawCycleIndex = Number(
        snapshot.weeklyChallengeCycleIndex
    )
    const rawEndMs = Number(
        snapshot.weeklyChallengeEndUnixMilliseconds
    )
    const rawPatternName =
        typeof snapshot.weeklyChallengePatternName ===
            "string"
            ? snapshot.weeklyChallengePatternName.trim()
            : ""

    if (
        !Number.isFinite(rawCycleIndex) ||
        rawCycleIndex < 0 ||
        rawCycleIndex >= 1_000_000
    ) {
        return null
    }

    if (
        !Number.isFinite(rawEndMs) ||
        rawEndMs <= 0
    ) {
        return null
    }

    if (!rawPatternName) {
        return null
    }

    return {
        weeklyChallengeCycleIndex:
            rawCycleIndex,
        weeklyChallengeEndUnixMilliseconds:
            rawEndMs,
        weeklyChallengePatternName:
            rawPatternName
    }
}

export function universalChallengeMatches(
    stored: UniversalProgress | null,
    computed: UniversalProgress
) {
    if (!stored) {
        return false
    }

    return (
        stored.weeklyChallengeCycleIndex ===
            computed.weeklyChallengeCycleIndex &&
        stored.weeklyChallengeEndUnixMilliseconds ===
            computed.weeklyChallengeEndUnixMilliseconds &&
        stored.weeklyChallengePatternName ===
            computed.weeklyChallengePatternName
    )
}

export function shouldClearLeaderboard(
    stored: UniversalProgress | null,
    computed: UniversalProgress
) {
    if (!stored) {
        return false
    }

    return (
        stored.weeklyChallengeCycleIndex !==
            computed.weeklyChallengeCycleIndex ||
        stored.weeklyChallengePatternName !==
            computed.weeklyChallengePatternName
    )
}

export function applyUniversalToDbState(
    snapshot: any,
    universal: UniversalProgress,
    clearedLeaderboard: boolean
) {
    const nextState = {
        ...(snapshot || {}),
        weeklyChallengeCycleIndex:
            universal.weeklyChallengeCycleIndex,
        weeklyChallengeEndUnixMilliseconds:
            universal.weeklyChallengeEndUnixMilliseconds,
        weeklyChallengePatternName:
            universal.weeklyChallengePatternName
    }

    if (!clearedLeaderboard) {
        return nextState
    }

    delete nextState.leaderboardTop25
    delete nextState.leaderboard
    delete nextState.leaderboardMeta
    delete nextState.leaderboardCycleIndex
    delete nextState.leaderboardPatternName

    return nextState
}
