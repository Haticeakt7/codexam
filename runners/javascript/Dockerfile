FROM node:20-alpine

WORKDIR /workspace

RUN printf '#!/bin/sh\necho "$SOURCE_CODE" | base64 -d > main.js\necho "$STDIN" | base64 -d > input.txt\nnode main.js < input.txt\n' > /workspace/run.sh && chmod +x /workspace/run.sh

ENTRYPOINT ["/workspace/run.sh"]
