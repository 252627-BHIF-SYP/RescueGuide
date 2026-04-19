# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# .csproj Dateien korrekt aus /src kopieren
COPY ["src/RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj", "RescueGuideDB.WebApp/"]
COPY ["src/RescueGuideDB.Core/RescueGuideDB.Core.csproj", "RescueGuideDB.Core/"]
COPY ["src/RescueGuideDB.Persistence/RescueGuideDB.Persistence.csproj", "RescueGuideDB.Persistence/"]

# Restore
RUN dotnet restore "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj"

# Rest kopieren
COPY src/ .

# Arbeitsverzeichnis setzen
WORKDIR "/src/RescueGuideDB.WebApp"

# Build/Publish
RUN dotnet publish "RescueGuideDB.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "RescueGuideDB.WebApp.dll"]