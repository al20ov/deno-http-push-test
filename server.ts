import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import mimeTypes from "./mimeTypes.ts";

let stream: TransformStream = new TransformStream();

let reader = stream.readable.getReader();
let writer = stream.writable.getWriter();

async function handler(req: Request): Promise<Response> {
  let { pathname } = new URL(req.url);

  if (pathname === "/sendinfo") {
    await writer.write(JSON.stringify(await req.json()));
    return new Response(null, { status: 200 });
  }
  if (pathname === "/stream") {
    const body = new ReadableStream({
      start(controller: ReadableStreamDefaultController) {
        send();
        function send() {
          reader.read().then(({ value }) => {
            console.log(value);
            controller.enqueue(value + "\n");
            send();
          }).catch((e) => {
            console.error(e);
            reader.releaseLock();
            writer.releaseLock();
            stream = new TransformStream();
            reader = stream.readable.getReader();
            writer = stream.writable.getWriter();
            try {
              controller.close()

            } catch {
              console.log("Controller closed")
            }
          });
        }
      },
      cancel() {
        // reader.releaseLock();
        // writer.releaseLock();
      },
    });
    return new Response(body.pipeThrough(new TextEncoderStream()), {
      headers: {
        "content-type": "application/json",
      },
    });
  } else {
    try {
      if (pathname === "/") {
        pathname = "/index.html";
      }
      const stream = await serveFile(pathname);

      const lastPeriod = pathname.lastIndexOf(".");
      const extension = pathname.substring(lastPeriod + 1);
      const mimeType: string = mimeTypes.get(extension) || "text/plain";
      return new Response(stream, {
        headers: { "content-type": mimeType },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  }
}

async function serveFile(pathname: string): Promise<ReadableStream> {
  try {
    // Return the readable stream for that file
    return (await Deno.open("public" + pathname, { read: true })).readable;
  } catch {
    throw new Error();
  }
}

serve(handler);
