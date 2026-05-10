package com.crew.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WeatherService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    public Map<String, Object> getWeather(String location, LocalDate date) {
        Map<String, Object> result = new HashMap<>();
        result.put("location", location);
        result.put("date", date.toString());
        
        try {
            String url = String.format("https://wttr.in/%s?format=j1", location);
            String response = restTemplate.getForObject(url, String.class);
            
            Map<String, Object> weatherData = parseWeather(response);
            result.putAll(weatherData);
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "获取天气信息失败：" + e.getMessage());
            result.put("temperature", "--");
            result.put("weatherDesc", "未知");
            result.put("humidity", "--");
            result.put("windSpeed", "--");
            result.put("feelsLike", "--");
        }
        
        return result;
    }
    
    public Map<String, Object> getDefaultWeather() {
        return getWeather("Beijing", LocalDate.now());
    }
    
    private Map<String, Object> parseWeather(String jsonResponse) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Pattern tempPattern = Pattern.compile("\"temp_C\"\\s*:\\s*\"([^\"]+)\"");
            Matcher tempMatcher = tempPattern.matcher(jsonResponse);
            if (tempMatcher.find()) {
                result.put("temperature", tempMatcher.group(1) + "°C");
            } else {
                result.put("temperature", "--");
            }
            
            Pattern feelsLikePattern = Pattern.compile("\"FeelsLikeC\"\\s*:\\s*\"([^\"]+)\"");
            Matcher feelsLikeMatcher = feelsLikePattern.matcher(jsonResponse);
            if (feelsLikeMatcher.find()) {
                result.put("feelsLike", feelsLikeMatcher.group(1) + "°C");
            } else {
                result.put("feelsLike", "--");
            }
            
            Pattern humidityPattern = Pattern.compile("\"humidity\"\\s*:\\s*\"([^\"]+)\"");
            Matcher humidityMatcher = humidityPattern.matcher(jsonResponse);
            if (humidityMatcher.find()) {
                result.put("humidity", humidityMatcher.group(1) + "%");
            } else {
                result.put("humidity", "--");
            }
            
            Pattern windPattern = Pattern.compile("\"windspeedKmph\"\\s*:\\s*\"([^\"]+)\"");
            Matcher windMatcher = windPattern.matcher(jsonResponse);
            if (windMatcher.find()) {
                result.put("windSpeed", windMatcher.group(1) + " km/h");
            } else {
                result.put("windSpeed", "--");
            }
            
            Pattern weatherDescPattern = Pattern.compile("\"value\"\\s*:\\s*\"([^\"]+)\"");
            Matcher weatherDescMatcher = weatherDescPattern.matcher(jsonResponse);
            if (weatherDescMatcher.find()) {
                result.put("weatherDesc", weatherDescMatcher.group(1));
            } else {
                result.put("weatherDesc", "未知");
            }
            
        } catch (Exception e) {
            result.put("temperature", "--");
            result.put("feelsLike", "--");
            result.put("humidity", "--");
            result.put("windSpeed", "--");
            result.put("weatherDesc", "未知");
        }
        
        return result;
    }
}