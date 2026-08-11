import { toDataSuffix } from "@celo/attribution-tags"
import { concat } from "viem"
import type { Hex } from "viem"

// Issued by Celo / MiniPay — must be present on-chain for program credit.
// Env override is optional; hardcoded fallback avoids silent no-ops when
// NEXT_PUBLIC_* vars are missing from the Cloudflare / CI build environment.
const ASSIGNED_ATTRIBUTION_CODE = "celo_sdv76xcw"

const APP_ATTRIBUTION_CODE =
    process.env.NEXT_PUBLIC_CELO_ATTRIBUTION_CODE?.trim() ||
    ASSIGNED_ATTRIBUTION_CODE

let cachedSuffix: Hex | undefined

export function getAttributionSuffix(): Hex {
    if (!cachedSuffix) {
        cachedSuffix = toDataSuffix(
            APP_ATTRIBUTION_CODE
        ) as Hex
    }

    return cachedSuffix
}

export function appendAttributionSuffix(
    data: Hex
) {
    return concat([
        data,
        getAttributionSuffix()
    ])
}
