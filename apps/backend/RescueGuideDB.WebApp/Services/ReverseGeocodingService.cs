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
                var address = FormatAddress(response);

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

    private static string? FormatAddress(NominatimResponse? response)
    {
        if (response?.Address == null)
        {
            return response?.DisplayName;
        }

        var street = response.Address.Road
            ?? response.Address.Pedestrian
            ?? response.Address.Residential
            ?? response.Address.Footway;
        var locality = response.Address.City
            ?? response.Address.Town
            ?? response.Address.Village
            ?? response.Address.Municipality;

        var streetAndNumber = string.Join(
            " ",
            new[] { street, response.Address.HouseNumber }
                .Where(value => !string.IsNullOrWhiteSpace(value)));
        var postcodeAndLocality = string.Join(
            " ",
            new[] { response.Address.Postcode, locality }
                .Where(value => !string.IsNullOrWhiteSpace(value)));

        var compactAddress = string.Join(
            ", ",
            new[] { streetAndNumber, postcodeAndLocality }
                .Where(value => !string.IsNullOrWhiteSpace(value)));

        return string.IsNullOrWhiteSpace(compactAddress)
            ? response.DisplayName
            : compactAddress;
    }

    private sealed class NominatimResponse
    {
        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("address")]
        public NominatimAddress? Address { get; set; }
    }

    private sealed class NominatimAddress
    {
        [JsonPropertyName("road")]
        public string? Road { get; set; }

        [JsonPropertyName("pedestrian")]
        public string? Pedestrian { get; set; }

        [JsonPropertyName("residential")]
        public string? Residential { get; set; }

        [JsonPropertyName("footway")]
        public string? Footway { get; set; }

        [JsonPropertyName("house_number")]
        public string? HouseNumber { get; set; }

        [JsonPropertyName("postcode")]
        public string? Postcode { get; set; }

        [JsonPropertyName("city")]
        public string? City { get; set; }

        [JsonPropertyName("town")]
        public string? Town { get; set; }

        [JsonPropertyName("village")]
        public string? Village { get; set; }

        [JsonPropertyName("municipality")]
        public string? Municipality { get; set; }
    }
}
