import { toDataSuffix } from "@celo/attribution-tags"
import { concat } from "viem"
import type { Hex } from "viem"

const APP_ATTRIBUTION_CODE =
    process.env.NEXT_PUBLIC_CELO_ATTRIBUTION_CODE?.trim()

export const APP_ATTRIBUTION_SUFFIX: Hex | undefined =
    APP_ATTRIBUTION_CODE
        ? (toDataSuffix(APP_ATTRIBUTION_CODE) as Hex)
        : undefined

export function appendAttributionSuffix(
    data: Hex
) {
    if (!APP_ATTRIBUTION_SUFFIX) {
        return data
    }

    return concat([
        data,
        APP_ATTRIBUTION_SUFFIX
    ])
}
