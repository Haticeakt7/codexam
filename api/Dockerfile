FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY api/ .
RUN dotnet restore CodExam.Api/CodExam.Api.csproj
RUN dotnet publish CodExam.Api/CodExam.Api.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /out .
EXPOSE 80
ENTRYPOINT ["dotnet", "CodExam.Api.dll"]
