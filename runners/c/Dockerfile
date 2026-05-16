FROM gcc:13

WORKDIR /workspace

# A simple wrapper to compile and run the base64 encoded source and stdin.
# This assumes SOURCE_CODE and STDIN are passed as environment variables.
RUN echo '#!/bin/bash\n\
echo "$SOURCE_CODE" | base64 -d > main.c\n\
echo "$STDIN" | base64 -d > input.txt\n\
gcc -O2 main.c -o program\n\
if [ $? -eq 0 ]; then\n\
  ./program < input.txt\n\
else\n\
  exit 1\n\
fi\n\
' > /workspace/run.sh && chmod +x /workspace/run.sh

ENTRYPOINT ["/workspace/run.sh"]
