FROM gcc:13

WORKDIR /workspace

RUN echo '#!/bin/bash\n\
echo "$SOURCE_CODE" | base64 -d > main.cpp\n\
echo "$STDIN" | base64 -d > input.txt\n\
g++ -O2 -std=c++17 main.cpp -o program\n\
if [ $? -eq 0 ]; then\n\
  ./program < input.txt\n\
else\n\
  exit 1\n\
fi\n\
' > /workspace/run.sh && chmod +x /workspace/run.sh

ENTRYPOINT ["/workspace/run.sh"]
