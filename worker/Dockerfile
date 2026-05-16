FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY api/ api/
COPY worker/ worker/

WORKDIR /app/worker
RUN dotnet restore CodExam.Worker/CodExam.Worker.csproj
RUN dotnet publish CodExam.Worker/CodExam.Worker.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Docker CLI installation for Docker.DotNet integration (if using local socket)
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .
ENTRYPOINT ["dotnet", "CodExam.Worker.dll"]
