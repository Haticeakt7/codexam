FROM golang:1.22

WORKDIR /workspace

RUN echo '#!/bin/bash\n\
echo "$SOURCE_CODE" | base64 -d > main.go\n\
echo "$STDIN" | base64 -d > input.txt\n\
go build -o program main.go\n\
if [ $? -eq 0 ]; then\n\
  ./program < input.txt\n\
else\n\
  exit 1\n\
fi\n\
' > /workspace/run.sh && chmod +x /workspace/run.sh

ENTRYPOINT ["/workspace/run.sh"]
