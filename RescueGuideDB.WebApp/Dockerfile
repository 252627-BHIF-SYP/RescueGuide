FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj"
RUN dotnet build "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RescueGuideDB.WebApp/RescueGuideDB.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 80
EXPOSE 443
ENTRYPOINT ["dotnet", "RescueGuideDB.WebApp.dll"]