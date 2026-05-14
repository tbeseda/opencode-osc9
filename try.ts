// @ts-nocheck
import { setTimeout } from "timers/promises"
import { OpencodeOsc9 } from "./index.ts"

const client = await OpencodeOsc9({
  client: {
    app: {
      log(payload: any) {
        console.error("Unable to send notification via OSC 9")
        console.log(JSON.stringify(payload, null, 2))
      }
    }
  }
})

console.log("Unfocus your terminal and wait 3 seconds")
await setTimeout(3000)
await client.event({
  event: {
    type: "session.error",
    properties: {
      error: { message: "agent ran rm -rf /" },
    },
  }
})
console.log("Error event sent")
console.log("You should have seen a notification")
