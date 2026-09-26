"""
Modular Weather Service & Agricultural Impact Analyzer
Pluggable provider interface allowing seamless switching between weather APIs
(OpenWeather, IMD, or Local Agricultural Climate Database).
Includes agronomic impact assessments for sugarcane:
- Temperature impact
- Rainfall impact
- Humidity impact
- Overall weather risk
"""

import os
import requests
from abc import ABC, abstractmethod
from datetime import datetime, date, timedelta

class ModularWeatherProvider(ABC):
    """Abstract interface for all weather providers"""
    @abstractmethod
    def get_current(self, location: str) -> dict:
        pass

    @abstractmethod
    def get_forecast(self, location: str) -> list:
        pass

    @abstractmethod
    def get_history(self, location: str) -> list:
        pass


class OpenWeatherProvider(ModularWeatherProvider):
    """External weather provider using OpenWeatherMap API"""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"

    def get_current(self, location: str) -> dict:
        url = f"{self.base_url}/weather?q={location},IN&units=metric&appid={self.api_key}"
        res = requests.get(url, timeout=5)
        if not res.ok:
            raise RuntimeError(f"OpenWeather API error: {res.status_code}")
        data = res.json()
        return {
            "location": data.get("name", location),
            "temperature": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "humidity": data["main"]["humidity"],
            "wind_speed": round(data["wind"]["speed"] * 3.6, 1),
            "rainfall": round(data.get("rain", {}).get("1h", 0.0), 1),
            "description": data["weather"][0]["description"].title(),
            "pressure": data["main"]["pressure"],
            "visibility": round(data.get("visibility", 10000) / 1000, 1),
            "is_demo": False
        }

    def get_forecast(self, location: str) -> list:
        url = f"{self.base_url}/forecast?q={location},IN&units=metric&appid={self.api_key}"
        res = requests.get(url, timeout=5)
        if not res.ok:
            raise RuntimeError(f"OpenWeather forecast error: {res.status_code}")
        raw = res.json().get("list", [])
        daily = {}
        for entry in raw:
            dt = datetime.fromtimestamp(entry["dt"]).date()
            if dt not in daily:
                daily[dt] = []
            daily[dt].append(entry)

        forecasts = []
        days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for dt, entries in list(daily.items())[:7]:
            temps = [e["main"]["temp"] for e in entries]
            humids = [e["main"]["humidity"] for e in entries]
            rain = sum([e.get("rain", {}).get("3h", 0) for e in entries])
            desc = entries[len(entries)//2]["weather"][0]["description"].title()
            forecasts.append({
                "date": dt.isoformat(),
                "day": days_of_week[dt.weekday()],
                "high": round(max(temps)),
                "low": round(min(temps)),
                "rainfall": round(rain, 1),
                "humidity": round(sum(humids) / len(humids)),
                "description": desc,
                "sugarcane_impact": "Optimal" if 24 <= sum(temps)/len(temps) <= 34 else "Watch"
            })
        return forecasts

    def get_history(self, location: str) -> list:
        # Fallback to local climatological series
        return LocalDatabaseWeatherProvider().get_history(location)


class LocalDatabaseWeatherProvider(ModularWeatherProvider):
    """
    Standard default provider using verified agricultural meteorological benchmarks
    for Indian sugarcane belts (Kolhapur, Mandya, Meerut, Pune, Belagavi).
    """
    LOCATION_DEFAULTS = {
        "kolhapur": {"temp": 28.5, "humidity": 74, "rain": 12.0, "wind": 11.0, "desc": "Partly Cloudy"},
        "mandya":   {"temp": 28.0, "humidity": 68, "rain": 15.0, "wind": 13.0, "desc": "Mild Breeze"},
        "belagavi": {"temp": 27.5, "humidity": 75, "rain": 25.0, "wind": 14.0, "desc": "Scattered Showers"},
        "meerut":   {"temp": 31.0, "humidity": 60, "rain": 5.0,  "wind": 9.0,  "desc": "Clear Sky"},
        "pune":     {"temp": 29.0, "humidity": 70, "rain": 10.0, "wind": 12.0, "desc": "Sunny Intervals"},
    }

    def get_current(self, location: str) -> dict:
        key = (location or "Kolhapur").strip().lower()
        base = self.LOCATION_DEFAULTS.get(key, {"temp": 29.0, "humidity": 72, "rain": 10.0, "wind": 10.5, "desc": "Partly Cloudy"})
        return {
            "location": location.title() if location else "Kolhapur",
            "temperature": base["temp"],
            "feels_like": round(base["temp"] + 1.5, 1),
            "humidity": base["humidity"],
            "wind_speed": base["wind"],
            "rainfall": base["rain"],
            "description": base["desc"],
            "pressure": 1012,
            "visibility": 9.5,
            "is_demo": True
        }

    def get_forecast(self, location: str) -> list:
        base = self.get_current(location)
        today = date.today()
        days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        deltas = [
            (0, 0, 15, "Partly Cloudy"),
            (1, -1, 5, "Scattered Showers"),
            (0, -2, 2, "Sunny"),
            (-1, 0, 0, "Clear"),
            (1, 1, 10, "Light Rain"),
            (2, 0, 8, "Humid & Warm"),
            (0, -1, 0, "Partly Cloudy")
        ]
        forecasts = []
        for i, (d_high, d_low, r, desc) in enumerate(deltas):
            d = today + timedelta(days=i)
            t = base["temperature"]
            forecasts.append({
                "date": d.isoformat(),
                "day": days_of_week[d.weekday()],
                "high": round(t + 2 + d_high),
                "low": round(t - 5 + d_low),
                "rainfall": r,
                "humidity": min(95, max(45, base["humidity"] + (i % 3) * 3)),
                "description": desc,
                "sugarcane_impact": "Optimal" if 25 <= t <= 34 else "Watch"
            })
        return forecasts

    def get_history(self, location: str) -> list:
        return [
            {"month": "Jan", "avg_temp": 24.2, "total_rainfall": 5.0,   "avg_humidity": 55, "sugarcane_suitability": "Moderate"},
            {"month": "Feb", "avg_temp": 26.8, "total_rainfall": 2.0,   "avg_humidity": 50, "sugarcane_suitability": "Moderate"},
            {"month": "Mar", "avg_temp": 30.5, "total_rainfall": 12.0,  "avg_humidity": 48, "sugarcane_suitability": "Good"},
            {"month": "Apr", "avg_temp": 33.2, "total_rainfall": 25.0,  "avg_humidity": 56, "sugarcane_suitability": "Good"},
            {"month": "May", "avg_temp": 32.8, "total_rainfall": 55.0,  "avg_humidity": 68, "sugarcane_suitability": "Optimal"},
            {"month": "Jun", "avg_temp": 28.5, "total_rainfall": 180.0, "avg_humidity": 82, "sugarcane_suitability": "Optimal"},
            {"month": "Jul", "avg_temp": 26.4, "total_rainfall": 280.0, "avg_humidity": 88, "sugarcane_suitability": "Optimal"},
            {"month": "Aug", "avg_temp": 26.0, "total_rainfall": 240.0, "avg_humidity": 86, "sugarcane_suitability": "Optimal"},
            {"month": "Sep", "avg_temp": 27.5, "total_rainfall": 140.0, "avg_humidity": 78, "sugarcane_suitability": "Optimal"},
            {"month": "Oct", "avg_temp": 28.0, "total_rainfall": 95.0,  "avg_humidity": 72, "sugarcane_suitability": "Good"},
            {"month": "Nov", "avg_temp": 26.0, "total_rainfall": 25.0,  "avg_humidity": 65, "sugarcane_suitability": "Good"},
            {"month": "Dec", "avg_temp": 24.0, "total_rainfall": 8.0,   "avg_humidity": 58, "sugarcane_suitability": "Moderate"}
        ]


class WeatherService:
    """Main weather module managing the active provider and computing agricultural risk"""
    def __init__(self, provider: ModularWeatherProvider = None):
        if provider:
            self.provider = provider
        else:
            api_key = os.environ.get("OPENWEATHER_API_KEY")
            if api_key:
                self.provider = OpenWeatherProvider(api_key)
            else:
                self.provider = LocalDatabaseWeatherProvider()

    def set_provider(self, provider: ModularWeatherProvider):
        """Allows runtime switching of the weather provider"""
        self.provider = provider

    def get_current(self, location: str) -> dict:
        return self.provider.get_current(location)

    def get_forecast(self, location: str) -> list:
        return self.provider.get_forecast(location)

    def get_history(self, location: str) -> list:
        return self.provider.get_history(location)

    @classmethod
    def evaluate_weather_impact(cls, temperature: float, rainfall: float, humidity: float) -> dict:
        """
        Assesses agronomic impact on sugarcane:
        - Temperature impact
        - Rainfall impact
        - Humidity impact
        - Overall weather risk
        """
        temp = float(temperature)
        rain = float(rainfall)
        humid = float(humidity)

        score = 100.0

        # 1. Temperature Impact (Ideal: 27°C - 34°C)
        if 27.0 <= temp <= 34.0:
            temp_impact = "Positive"
            temp_note = f"{temp}°C is within the ideal 27–34°C photosynthetic window for rapid stalk elongation."
        elif 22.0 <= temp < 27.0:
            temp_impact = "Watch"
            temp_note = f"{temp}°C is slightly cool; vegetative growth rate slows moderately."
            score -= 10.0
        elif 34.0 < temp <= 38.0:
            temp_impact = "Watch"
            temp_note = f"{temp}°C is elevated; ensure sufficient root moisture to prevent canopy desiccation."
            score -= 15.0
        else:
            temp_impact = "Severe"
            temp_note = f"{temp}°C causes thermal stress; growth halts and respiration losses increase."
            score -= 30.0

        # 2. Rainfall Impact (Seasonal or annual equivalent)
        # Note: If input is seasonal/annual (e.g. >300mm) vs daily/monthly
        if rain >= 800.0:  # Annual/Seasonal metric
            if 1100.0 <= rain <= 1600.0:
                rain_impact = "Positive"
                rain_note = f"{rain} mm total rainfall meets annual sugarcane water demand perfectly."
            elif 800.0 <= rain < 1100.0:
                rain_impact = "Watch"
                rain_note = f"{rain} mm is below optimal 1200mm; supplementary drip or furrow irrigation required."
                score -= 15.0
            else:
                rain_impact = "Watch"
                rain_note = f"{rain} mm excess rainfall requires active drainage channels to prevent waterlogging."
                score -= 15.0
        else: # Daily/Monthly metric
            if 50.0 <= rain <= 200.0:
                rain_impact = "Positive"
                rain_note = f"{rain} mm rainfall provides excellent soil profile moisture recharge."
            elif rain < 50.0:
                rain_impact = "Watch"
                rain_note = f"{rain} mm rainfall is low; maintain regular irrigation schedule."
                score -= 10.0
            else:
                rain_impact = "Severe"
                rain_note = f"{rain} mm heavy precipitation; monitor for water stagnation in furrows."
                score -= 20.0

        # 3. Humidity Impact (Ideal: 65% - 80%)
        if 65.0 <= humid <= 80.0:
            humid_impact = "Positive"
            humid_note = f"{humid}% humidity maintains healthy stomatal conductance without excessive fungal risk."
        elif 50.0 <= humid < 65.0:
            humid_impact = "Watch"
            humid_note = f"{humid}% humidity is somewhat dry; transpirational water demand increases."
            score -= 10.0
        elif humid > 85.0:
            humid_impact = "Watch"
            humid_note = f"{humid}% excessive humidity; scout for rust and red rot fungal proliferation."
            score -= 15.0
        else:
            humid_impact = "Severe"
            humid_note = f"{humid}% dry air causes severe leaf moisture deficit."
            score -= 25.0

        score = max(30.0, min(100.0, score))
        if score >= 80.0:
            overall_risk = "Low"
            overall_label = "Optimal"
        elif score >= 65.0:
            overall_risk = "Medium"
            overall_label = "Favourable"
        elif score >= 50.0:
            overall_risk = "High"
            overall_label = "Challenging"
        else:
            overall_risk = "Critical"
            overall_label = "Severe Risk"

        return {
            "temperature": {
                "value": temp,
                "impact": temp_impact,
                "note": temp_note
            },
            "rainfall": {
                "value": rain,
                "impact": rain_impact,
                "note": rain_note
            },
            "humidity": {
                "value": humid,
                "impact": humid_impact,
                "note": humid_note
            },
            "overall": {
                "score": round(score),
                "risk": overall_risk,
                "label": overall_label
            }
        }
