const decoder = new TextDecoder();

let currentLine = "";
const queue = [];

function test() {
  fetch("/sendinfo", {
    method: "POST",
    body: JSON.stringify({ coucou: "salut" }),
  });
}

fetch("/stream")
  .then((response) => response.body)
  .then((body) => body.getReader())
  .then((reader) => {
    return new ReadableStream({
      start(controller) {
        return pump();
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            let text = decoder.decode(value);

            while (text !== null) {
              text = parseLines(text);
            }

            return pump();
          });
        }
      },
    });
  });

function parseLines(text) {
  const newline = text.search(/\n/);

  if (newline === -1) {
    currentLine += text;
    return null;
  } else {
    const lineEnd = text.substring(0, newline);
    const newLineStart = text.substring(newline + 1);

    currentLine += lineEnd;
    queue.push(JSON.parse(currentLine));
    currentLine = new String();
    return newLineStart;
  }
}
