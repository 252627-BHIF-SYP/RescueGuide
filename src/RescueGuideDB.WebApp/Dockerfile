# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Pfade relativ zum Hauptordner (rescueguide/)
COPY ["src/RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj", "RescueGuideDB.WebApp/"]
COPY ["src/RescueGuideDB.Core/RescueGuideDB.Core.csproj", "RescueGuideDB.Core/"]
COPY ["src/RescueGuideDB.Persistence/RescueGuideDB.Persistence.csproj", "RescueGuideDB.Persistence/"]

RUN dotnet restore "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj"

COPY src/ .
WORKDIR "/src/RescueGuideDB.WebApp"
RUN dotnet publish "RescueGuideDB.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Interner Port für den Container
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "RescueGuideDB.WebApp.dll"]