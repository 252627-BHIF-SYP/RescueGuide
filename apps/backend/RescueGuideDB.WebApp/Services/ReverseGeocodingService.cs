using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace WebApplication1.Services;

public class ReverseGeocodingService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ReverseGeocodingService> _logger;
    private readonly SemaphoreSlim _requestLock = new(1, 1);
    private DateTimeOffset _lastRequestAt = DateTimeOffset.MinValue;

    public ReverseGeocodingService(
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        ILogger<ReverseGeocodingService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> GetAddressAsync(
        double latitude,
        double longitude,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = FormattableString.Invariant(
            $"reverse-geocode:{latitude:F6}:{longitude:F6}");

        if (_cache.TryGetValue(cacheKey, out string? cachedAddress))
        {
            return string.IsNullOrWhiteSpace(cachedAddress) ? null : cachedAddress;
        }

        await _requestLock.WaitAsync(cancellationToken);
        try
        {
            if (_cache.TryGetValue(cacheKey, out cachedAddress))
            {
                return string.IsNullOrWhiteSpace(cachedAddress) ? null : cachedAddress;
            }

            var timeSinceLastRequest = DateTimeOffset.UtcNow - _lastRequestAt;
            if (timeSinceLastRequest < TimeSpan.FromSeconds(1))
            {
                await Task.Delay(TimeSpan.FromSeconds(1) - timeSinceLastRequest, cancellationToken);
            }

            var lat = latitude.ToString("R", CultureInfo.InvariantCulture);
            var lon = longitude.ToString("R", CultureInfo.InvariantCulture);
            var path = $"reverse?format=jsonv2&lat={lat}&lon={lon}&zoom=18&layer=address";

            try
            {
                var client = _httpClientFactory.CreateClient("ReverseGeocoding");
                var response = await client.GetFromJsonAsync<NominatimResponse>(path, cancellationToken);
                var address = response?.DisplayName;

                _cache.Set(cacheKey, address ?? string.Empty, TimeSpan.FromDays(30));
                return address;
            }
            catch (Exception exception) when (
                exception is HttpRequestException or TaskCanceledException or JsonException)
            {
                _logger.LogWarning(
                    exception,
                    "Reverse geocoding failed for {Latitude}, {Longitude}",
                    latitude,
                    longitude);
                _cache.Set(cacheKey, string.Empty, TimeSpan.FromMinutes(10));
                return null;
            }
            finally
            {
                _lastRequestAt = DateTimeOffset.UtcNow;
            }
        }
        finally
        {
            _requestLock.Release();
        }
    }

    private sealed class NominatimResponse
    {
        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }
    }
}
