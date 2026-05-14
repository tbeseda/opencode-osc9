import { closeSync, openSync, writeSync } from "fs"
import type { Plugin } from "@opencode-ai/plugin" // these types tend to lag behind actual capabilities

// OSC 9 generally takes a single string. Strip control bytes and cap length to keep notifications sane
function osc9(text: string): string {
  const safe = text.replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 256)
  return `\x1b]9;${safe}\x1b\\`
}

async function notify(text: string, log: Function): Promise<void> {
  let fd: number | undefined
  try {
    fd = openSync("/dev/tty", "w")
    writeSync(fd, osc9(text))
  } catch (err) {
    await log({
        body: {
          service: "opencode-osc9",
          level: "warn",
          message: "Failed to notify",
          extra: { text, err: err instanceof Error ? err.message : String(err) },
        },
      })
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd)
      } catch {
        // ignore
      }
    }
  }
}

export const OpencodeOsc9: Plugin = async ({client}) => {
  return {
    event: async ({ event }) => {
      const {type, properties } = event

      switch (type) {
        case "session.idle":
          await notify("session idle", client.app.log)
          break
        // @ts-expect-error - types lag
        case "permission.ask": {
          // @ts-expect-error - types lag
          const perm = (properties?.permission as string | undefined) ?? "unknown"
          await notify(`needs approval: ${perm}`, client.app.log)
          break
        }
        case "session.error": {
          const err = properties?.error as { message?: string } | undefined
          await notify(`error${err?.message ? ": " + err.message : ""}`, client.app.log)
          break
        }
      }
    },
  }
}
