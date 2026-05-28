import { NextResponse } from "next/server"

import {
    submitChallengeScore,
    getChallengeLeaderboard
} from "@/lib/Leaderboard"
import { recordChallengePlay } from "@/lib/server-user-state"

const MAX_LEADERBOARD_ENTRIES = 25

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json()

        const action =
            body.action

        if (action === "submit") {
            const walletAddress =
                body.walletAddress
            const playerName =
                body.playerName ||
                "Guest"
            const cycleIndex = Number(
                body.cycleIndex || 0
            )
            const patternName =
                body.patternName ||
                "Unknown"
            const completionSeconds = Number(
                body.completionSeconds || 0
            )

            if (!walletAddress) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Wallet missing"
                    },
                    {
                        status: 400
                    }
                )
            }

            const result =
                await submitChallengeScore(
                    walletAddress,
                    playerName,
                    cycleIndex,
                    patternName,
                    completionSeconds
                )

            void recordChallengePlay(
                walletAddress,
                completionSeconds
            )

            return NextResponse.json({
                success: true,
                result
            })
        }

        if (action === "get") {
            const cycleIndex = Number(
                body.cycleIndex || 0
            )
            const patternName =
                body.patternName ||
                "Unknown"
            const playerWallet =
                body.walletAddress

            const leaderboard =
                await getChallengeLeaderboard(
                    cycleIndex,
                    patternName,
                    MAX_LEADERBOARD_ENTRIES,
                    playerWallet
                )

            return NextResponse.json({
                success: true,
                entries: leaderboard.entries.map(
                    entry => ({
                        rank: entry.rank,
                        playerName:
                            entry.playerName,
                        walletAddress:
                            entry.walletAddress,
                        completionSeconds:
                            entry.completionSeconds
                    })
                ),
                playerRank:
                    leaderboard.playerRank,
                cycleIndex:
                    leaderboard.cycleIndex,
                patternName:
                    leaderboard.patternName,
                version:
                    leaderboard.version,
                updatedAt:
                    leaderboard.updatedAt
            })
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Unknown action"
            },
            {
                status: 400
            }
        )
    } catch (error: any) {
        console.error(
            "Leaderboard API Error",
            error
        )

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Leaderboard API failed"
            },
            {
                status: 500
            }
        )
    }
}
