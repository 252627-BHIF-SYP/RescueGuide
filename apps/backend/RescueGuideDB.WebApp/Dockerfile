# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Pfade relativ zu apps/backend/
COPY ["RescueGuideDB.Core/RescueGuideDB.Core.csproj", "RescueGuideDB.Core/"]
COPY ["RescueGuideDB.Persistence/RescueGuideDB.Persistence.csproj", "RescueGuideDB.Persistence/"]
COPY ["RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj", "RescueGuideDB.WebApp/"]

RUN dotnet restore "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj"

COPY . .
WORKDIR "/src/RescueGuideDB.WebApp"
RUN dotnet publish "RescueGuideDB.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Interner Port für den Container
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "RescueGuideDB.WebApp.dll"]