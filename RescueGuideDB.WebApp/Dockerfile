# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Kopiere die .csproj Dateien einzeln (für effizientes Caching)
COPY ["RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj", "RescueGuideDB.WebApp/"]
COPY ["RescueGuideDB.Core/RescueGuideDB.Core.csproj", "RescueGuideDB.Core/"]
COPY ["RescueGuideDB.Persistence/RescueGuideDB.Persistence.csproj", "RescueGuideDB.Persistence/"]

# Restore ausführen
RUN dotnet restore "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj"

# Den gesamten Rest kopieren
COPY . .

# Verzeichnis wechseln und Publish
WORKDIR "/src/RescueGuideDB.WebApp"
RUN dotnet publish "RescueGuideDB.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Port-Konfiguration
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "RescueGuideDB.WebApp.dll"]