FROM python:3.12-alpine

WORKDIR /workspace

RUN printf '#!/bin/sh\necho "$SOURCE_CODE" | base64 -d > main.py\necho "$STDIN" | base64 -d > input.txt\npython3 main.py < input.txt\n' > /workspace/run.sh && chmod +x /workspace/run.sh

ENTRYPOINT ["/workspace/run.sh"]
